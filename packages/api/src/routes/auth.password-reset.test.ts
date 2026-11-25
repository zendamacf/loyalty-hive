import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import {
  apiKeyHeaders,
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { config } from "../common/config";
import { BCRYPT_COST } from "../common/constants";
import { INVALID_PASSWORD_RESET_TOKEN_MESSAGE } from "../common/error";
import { hashResetToken } from "../common/password-reset";
import { db } from "../db/client";
import { users } from "../db/schema";

/** Dedicated id and email: do not reuse other suites' fixtures. */
const USER_ID = "a0000000-0000-4000-8000-000000000042";
const EMAIL = "password.reset.test@example.com";
const OLD_PASSWORD = "OldPassword123";
const NEW_PASSWORD = "NewPassword456";
const RESET_TOKEN = "reset-token-for-tests";

let app: ReturnType<typeof createApiRouterApp>;

function post(path: string, body: unknown) {
  return app.request(`/api/v1/auth${path}`, {
    method: "POST",
    headers: apiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

/** A token issued a minute ago, so it is older than any password change made now. */
async function signOldToken() {
  const iat = Math.floor(Date.now() / 1000) - 60;
  return sign(
    { sub: USER_ID, iat, exp: iat + 3600 },
    config.jwt.accessSecret,
    "HS256",
  );
}

async function seedResetToken(expiresAt: Date) {
  await db
    .update(users)
    .set({
      passwordResetTokenHash: hashResetToken(RESET_TOKEN),
      passwordResetExpiresAt: expiresAt,
    })
    .where(eq(users.id, USER_ID));
}

async function getUser() {
  const [user] = await db.select().from(users).where(eq(users.id, USER_ID));
  return user;
}

beforeAll(() => {
  app = createApiRouterApp();
});

beforeEach(async () => {
  const passwordHash = await bcryptHash(OLD_PASSWORD, BCRYPT_COST);
  await db.delete(users).where(eq(users.email, EMAIL));
  await db.insert(users).values({
    id: USER_ID,
    email: EMAIL,
    passwordHash,
    emailVerifiedAt: new Date(),
  });
});

describe("POST /auth/forgot-password", () => {
  it("stores a hashed, expiring token for an existing account", async () => {
    const response = await post("/forgot-password", { email: EMAIL });

    expect(response.status).toBe(200);
    const user = await getUser();
    expect(user?.passwordResetTokenHash).toBeString();
    expect(user?.passwordResetExpiresAt?.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns the same response for an unknown email", async () => {
    const known = await post("/forgot-password", { email: EMAIL });
    const unknown = await post("/forgot-password", {
      email: "nobody.here@example.com",
    });

    expect(unknown.status).toBe(known.status);
    expect(await unknown.json()).toEqual(await known.json());
  });

  it("returns 400 for an invalid email", async () => {
    const response = await post("/forgot-password", { email: "not-an-email" });
    expect(response.status).toBe(400);
  });

  it("returns 401 without an API key", async () => {
    const response = await app.request("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL }),
    });
    expect(response.status).toBe(401);
  });
});

describe("POST /auth/reset-password", () => {
  it("changes the password, clears the token and allows a new login", async () => {
    await seedResetToken(new Date(Date.now() + 60_000));

    const response = await post("/reset-password", {
      token: RESET_TOKEN,
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reset: true });

    const user = await getUser();
    expect(await bcryptCompare(NEW_PASSWORD, user?.passwordHash ?? "")).toBe(
      true,
    );
    expect(user?.passwordResetTokenHash).toBeNull();
    expect(user?.passwordResetExpiresAt).toBeNull();
    expect(user?.passwordChangedAt).toBeInstanceOf(Date);

    const login = await post("/login", {
      email: EMAIL,
      password: NEW_PASSWORD,
    });
    expect(login.status).toBe(200);
    const oldLogin = await post("/login", {
      email: EMAIL,
      password: OLD_PASSWORD,
    });
    expect(oldLogin.status).toBe(401);
  });

  it("rejects a token that was already used", async () => {
    await seedResetToken(new Date(Date.now() + 60_000));
    await post("/reset-password", {
      token: RESET_TOKEN,
      password: NEW_PASSWORD,
    });

    const second = await post("/reset-password", {
      token: RESET_TOKEN,
      password: "AnotherPass789",
    });

    expect(second.status).toBe(400);
    expect(await second.json()).toEqual({
      error: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
    });
  });

  it("rejects an expired token", async () => {
    await seedResetToken(new Date(Date.now() - 1000));

    const response = await post("/reset-password", {
      token: RESET_TOKEN,
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(400);
    const user = await getUser();
    expect(await bcryptCompare(OLD_PASSWORD, user?.passwordHash ?? "")).toBe(
      true,
    );
  });

  it("rejects an unknown token", async () => {
    const response = await post("/reset-password", {
      token: "unknown-token",
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
    });
  });

  it("rejects a password that fails the policy and keeps the token valid", async () => {
    await seedResetToken(new Date(Date.now() + 60_000));

    const weak = await post("/reset-password", {
      token: RESET_TOKEN,
      password: "short",
    });
    expect(weak.status).toBe(400);

    const user = await getUser();
    expect(user?.passwordResetTokenHash).toBe(hashResetToken(RESET_TOKEN));
    expect(user?.passwordChangedAt).toBeNull();
  });

  it("revokes tokens issued before the reset", async () => {
    const oldToken = await signOldToken();
    const before = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(oldToken),
    });
    expect(before.status).toBe(200);

    await seedResetToken(new Date(Date.now() + 60_000));
    await post("/reset-password", {
      token: RESET_TOKEN,
      password: NEW_PASSWORD,
    });

    const after = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(oldToken),
    });
    expect(after.status).toBe(401);
  });

  it("accepts tokens issued after the reset", async () => {
    await seedResetToken(new Date(Date.now() + 60_000));
    await post("/reset-password", {
      token: RESET_TOKEN,
      password: NEW_PASSWORD,
    });

    const newToken = await signTestToken(USER_ID);
    const response = await app.request("/api/v1/auth/me", {
      headers: authBearerHeaders(newToken),
    });
    expect(response.status).toBe(200);
  });
});
