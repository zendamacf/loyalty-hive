import { beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { hash as bcryptHash } from "bcryptjs";
import {
  apiKeyHeaders,
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { BCRYPT_COST } from "../common/constants";
import { EMAIL_NOT_VERIFIED_MESSAGE } from "../common/error";
import { db } from "../db/client";
import { users } from "../db/schema";

const VALID_SIGNUP_PASSWORD = "ValidPass1234";

let app: ReturnType<typeof createApiRouterApp>;

beforeAll(() => {
  app = createApiRouterApp();
});

describe("requireEmailVerified middleware", () => {
  it("returns 403 for unverified users on protected card routes", async () => {
    const email = `unverified.${randomUUID()}@example.com`;
    const signupRes = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password: VALID_SIGNUP_PASSWORD }),
    });
    expect(signupRes.status).toBe(201);
    const { id } = (await signupRes.json()) as { id: string };
    const token = await signTestToken(id);

    const response = await app.request("/api/v1/cards", {
      headers: authBearerHeaders(token),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: EMAIL_NOT_VERIFIED_MESSAGE,
    });
  });

  it("allows verified users on protected card routes", async () => {
    const email = `verified.${randomUUID()}@example.com`;
    const passwordHash = await bcryptHash(VALID_SIGNUP_PASSWORD, BCRYPT_COST);
    const userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
    });

    const token = await signTestToken(userId);
    const response = await app.request("/api/v1/cards", {
      headers: authBearerHeaders(token),
    });

    expect(response.status).toBe(200);
  });
});
