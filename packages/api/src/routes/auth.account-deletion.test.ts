import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  apiKeyHeaders,
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { purgeDeletedAccounts } from "../common/account-deletion";
import { ACCOUNT_DELETION_GRACE_DAYS, BCRYPT_COST } from "../common/constants";
import {
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_PENDING_DELETION_EMAIL_MESSAGE,
  INCORRECT_PASSWORD_MESSAGE,
} from "../common/error";
import { hashResetToken } from "../common/password-reset";
import { db } from "../db/client";
import { brandRequests, cards, users } from "../db/schema";

/** Dedicated ids and emails: do not reuse other suites' fixtures. */
const USER_ID = "a0000000-0000-4000-8000-000000000137";
const OTHER_USER_ID = "a0000000-0000-4000-8000-000000000138";
const EMAIL = "account.deletion.test@example.com";
const OTHER_EMAIL = "account.deletion.other@example.com";
const PASSWORD = "CorrectPassword123";
const DAY_MS = 24 * 60 * 60 * 1000;

let app: ReturnType<typeof createApiRouterApp>;

function request(
  method: string,
  path: string,
  body: unknown,
  headers: Record<string, string>,
) {
  return app.request(`/api/v1/auth${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function deleteMe(password: string, token: string) {
  return request("DELETE", "/me", { password }, authBearerHeaders(token));
}

async function getUser(id = USER_ID) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

beforeAll(() => {
  app = createApiRouterApp();
});

beforeEach(async () => {
  const passwordHash = await bcryptHash(PASSWORD, BCRYPT_COST);
  await db.delete(users).where(eq(users.email, EMAIL));
  await db.delete(users).where(eq(users.email, OTHER_EMAIL));
  await db.insert(users).values([
    { id: USER_ID, email: EMAIL, passwordHash, emailVerifiedAt: new Date() },
    {
      id: OTHER_USER_ID,
      email: OTHER_EMAIL,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  ]);
});

describe("DELETE /auth/me", () => {
  it("keeps the account when the password is wrong", async () => {
    const token = await signTestToken(USER_ID);

    const response = await deleteMe("WrongPassword123", token);

    // 403, not 401: the app signs the user out on any 401.
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: INCORRECT_PASSWORD_MESSAGE,
    });
    expect((await getUser())?.deletedAt).toBeNull();
    const me = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(token),
    });
    expect(me.status).toBe(200);
  });

  it("marks the account deleted and returns the purge date", async () => {
    const token = await signTestToken(USER_ID);

    const response = await deleteMe(PASSWORD, token);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      deleted: boolean;
      purgeAfter: string;
    };
    expect(body.deleted).toBe(true);
    const user = await getUser();
    expect(user?.deletedAt).toBeInstanceOf(Date);
    expect(new Date(body.purgeAfter).getTime()).toBe(
      (user?.deletedAt?.getTime() ?? 0) + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS,
    );
  });

  it("rejects the old token after deletion", async () => {
    const token = await signTestToken(USER_ID);
    await deleteMe(PASSWORD, token);

    const me = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(token),
    });

    expect(me.status).toBe(401);
  });

  it("blocks login with a clear message, and still hides it from wrong passwords", async () => {
    await deleteMe(PASSWORD, await signTestToken(USER_ID));

    const right = await request(
      "POST",
      "/login",
      { email: EMAIL, password: PASSWORD },
      apiKeyHeaders(),
    );
    expect(right.status).toBe(403);
    expect(await right.json()).toEqual({ error: ACCOUNT_DELETED_MESSAGE });

    const wrong = await request(
      "POST",
      "/login",
      { email: EMAIL, password: "WrongPassword123" },
      apiKeyHeaders(),
    );
    expect(wrong.status).toBe(401);
  });

  it("reserves the email: signup returns a clear 409", async () => {
    await deleteMe(PASSWORD, await signTestToken(USER_ID));

    const response = await request(
      "POST",
      "/signup",
      { email: EMAIL, password: PASSWORD },
      apiKeyHeaders(),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: ACCOUNT_PENDING_DELETION_EMAIL_MESSAGE,
    });
  });

  it("sends no reset email and rejects reset tokens for a deleted account", async () => {
    await deleteMe(PASSWORD, await signTestToken(USER_ID));

    const forgot = await request(
      "POST",
      "/forgot-password",
      { email: EMAIL },
      apiKeyHeaders(),
    );
    expect(forgot.status).toBe(200);
    expect((await getUser())?.passwordResetTokenHash).toBeNull();

    await db
      .update(users)
      .set({
        passwordResetTokenHash: hashResetToken("late-token"),
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      })
      .where(eq(users.id, USER_ID));
    const reset = await request(
      "POST",
      "/reset-password",
      { token: "late-token", password: "NewPassword456" },
      apiKeyHeaders(),
    );
    expect(reset.status).toBe(400);
  });

  it("returns 401 without a token and 400 without a password", async () => {
    const noToken = await app.request("/api/v1/auth/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: PASSWORD }),
    });
    expect(noToken.status).toBe(401);

    const noPassword = await request(
      "DELETE",
      "/me",
      {},
      authBearerHeaders(await signTestToken(USER_ID)),
    );
    expect(noPassword.status).toBe(400);
  });
});

describe("DELETE /auth/me rate limit", () => {
  it("returns 429 after too many attempts for one user", async () => {
    const previous = process.env.RATE_LIMIT_AUTH_DELETE_ACCOUNT_MAX;
    process.env.RATE_LIMIT_AUTH_DELETE_ACCOUNT_MAX = "2";
    const token = await signTestToken(OTHER_USER_ID);
    try {
      const first = await deleteMe("WrongPassword123", token);
      const second = await deleteMe("WrongPassword123", token);
      const third = await deleteMe("WrongPassword123", token);
      expect([first.status, second.status, third.status]).toEqual([
        403, 403, 429,
      ]);
    } finally {
      if (previous === undefined) {
        delete process.env.RATE_LIMIT_AUTH_DELETE_ACCOUNT_MAX;
      } else {
        process.env.RATE_LIMIT_AUTH_DELETE_ACCOUNT_MAX = previous;
      }
    }
  });
});

describe("purgeDeletedAccounts", () => {
  async function seedData(userId: string) {
    const [request] = await db
      .insert(brandRequests)
      .values({
        userId,
        requestedName: `Brand ${userId}`,
        normalizedName: `brand ${userId}`,
        url: "https://example.com",
      })
      .returning({ id: brandRequests.id });
    await db.insert(cards).values([
      { userId, cardNumber: "111" },
      { userId, cardNumber: "222", deletedAt: new Date() },
    ]);
    return request.id;
  }

  it("removes accounts past the grace period with their cards and brand requests", async () => {
    await seedData(USER_ID);
    const expired = new Date(
      Date.now() - (ACCOUNT_DELETION_GRACE_DAYS + 1) * DAY_MS,
    );
    await db
      .update(users)
      .set({ deletedAt: expired })
      .where(eq(users.id, USER_ID));

    const removed = await purgeDeletedAccounts();

    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await getUser()).toBeUndefined();
    expect(
      await db.select().from(cards).where(eq(cards.userId, USER_ID)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(brandRequests)
        .where(eq(brandRequests.userId, USER_ID)),
    ).toHaveLength(0);
  });

  it("keeps accounts inside the grace period and active accounts", async () => {
    await seedData(OTHER_USER_ID);
    const recent = new Date(
      Date.now() - (ACCOUNT_DELETION_GRACE_DAYS - 1) * DAY_MS,
    );
    await db
      .update(users)
      .set({ deletedAt: recent })
      .where(eq(users.id, USER_ID));

    await purgeDeletedAccounts();

    expect(await getUser()).toBeDefined();
    expect(await getUser(OTHER_USER_ID)).toBeDefined();
    expect(
      await db.select().from(cards).where(eq(cards.userId, OTHER_USER_ID)),
    ).toHaveLength(2);
  });

  it("rejects an old token once the account is purged", async () => {
    const token = await signTestToken(USER_ID);
    await db
      .update(users)
      .set({ deletedAt: new Date(Date.now() - 31 * DAY_MS) })
      .where(eq(users.id, USER_ID));
    await purgeDeletedAccounts();

    const me = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(token),
    });

    expect(me.status).toBe(401);
  });
});
