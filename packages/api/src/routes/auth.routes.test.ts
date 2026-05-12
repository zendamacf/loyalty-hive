import { beforeAll, describe, expect, it } from "bun:test";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { config } from "../common/config";
import { db } from "../db/client";
import { users } from "../db/schema";
import authRouter from "./auth.routes";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEST_EMAIL = "auth.test@example.com";
const TEST_PASSWORD = "correct-horse-battery-staple";

function createApiApp() {
  const app = new Hono();
  app.route("/api/v1/auth", authRouter);
  return app;
}

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET ??= "test-secret";

  const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 10);

  await db.insert(users).values({
    id: USER_ID,
    email: TEST_EMAIL,
    passwordHash,
  });
});

describe("auth routes", () => {
  it("returns 401 for wrong password", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "wrong-password",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@example.com",
        password: TEST_PASSWORD,
      }),
    });

    expect(response.status).toBe(401);
  });

  it("returns a JWT for valid credentials", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
});
