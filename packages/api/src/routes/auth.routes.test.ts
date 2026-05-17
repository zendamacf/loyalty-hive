import { beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { compare as bcryptCompare, hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { verify } from "hono/jwt";
import { apiKeyHeaders, createApiRouterApp } from "../../test/create-app";
import { seedTestApiKey } from "../../test/seed-api-key";
import { config } from "../common/config";
import { BCRYPT_COST } from "../common/constants";
import { db } from "../db/client";
import { users } from "../db/schema";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEST_EMAIL = "auth.test@example.com";
const TEST_PASSWORD = "correct-horse-battery-staple";

beforeAll(async () => {
  await seedTestApiKey();

  const passwordHash = await bcryptHash(TEST_PASSWORD, BCRYPT_COST);

  await db
    .insert(users)
    .values({
      id: USER_ID,
      email: TEST_EMAIL,
      passwordHash,
    })
    .onConflictDoNothing();
});

describe("auth routes", () => {
  it("returns 401 when API key header is missing", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "API key is required",
    });
  });

  it("returns 403 when API key is invalid", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "wrong-key",
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Invalid API key",
    });
  });

  it("returns 401 with error message for wrong password", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "wrong-password",
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password",
    });
  });

  it("returns 401 for unknown email", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: "nobody@example.com",
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("returns a JWT for valid credentials", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { token: string };
    expect(body.token).toBeString();

    const payload = await verify(body.token, config.jwt.accessSecret, "HS256");
    expect(payload.sub).toBe(USER_ID);
  });

  it("logs in with different email casing and surrounding whitespace", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: `  ${TEST_EMAIL.toUpperCase()}  `,
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { token: string };
    const payload = await verify(body.token, config.jwt.accessSecret, "HS256");
    expect(payload.sub).toBe(USER_ID);
  });

  it("returns 400 for invalid email on login", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: "not-an-email",
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for empty password on login", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed JSON on login", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: "{",
    });

    expect(response.status).toBe(400);
  });

  it("creates a user and stores a bcrypt password hash", async () => {
    const app = createApiRouterApp();
    const email = `new.user.${randomUUID()}@example.com`;
    const password = "signup-password-123";

    const response = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { id: string; email: string };
    expect(body.email).toBe(email.toLowerCase());

    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, body.id));

    expect(await bcryptCompare(password, row.passwordHash)).toBe(true);
  });

  it("returns 409 when email is already registered", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "some-password",
      }),
    });

    expect(response.status).toBe(409);
  });

  it("allows login after signup", async () => {
    const app = createApiRouterApp();
    const email = `login.after.signup.${randomUUID()}@example.com`;
    const password = "after-signup-secret";

    const signupRes = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password }),
    });
    expect(signupRes.status).toBe(201);

    const loginRes = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, password }),
    });

    expect(loginRes.status).toBe(200);
  });
});
