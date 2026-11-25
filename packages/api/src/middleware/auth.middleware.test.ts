import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { config } from "../common/config";
import { db } from "../db/client";
import { users } from "../db/schema";
import { requireUserAuth } from "./auth.middleware";

/** Dedicated id: the middleware reads the user row, so the user must exist. */
const USER_ID = "a0000000-0000-4000-8000-000000000011";
const DELETED_USER_ID = "a0000000-0000-4000-8000-000000000012";
const CHANGED_USER_ID = "a0000000-0000-4000-8000-000000000013";
const MISSING_USER_ID = "a0000000-0000-4000-8000-000000000014";

async function ensureUser(
  id: string,
  extra: { deletedAt?: Date; passwordChangedAt?: Date } = {},
) {
  await db.delete(users).where(eq(users.id, id));
  await db.insert(users).values({
    id,
    email: `${id}@middleware.test.example.com`,
    passwordHash: "not-used",
    ...extra,
  });
}

beforeAll(async () => {
  await ensureUser(USER_ID);
  await ensureUser(DELETED_USER_ID, { deletedAt: new Date() });
  await ensureUser(CHANGED_USER_ID, { passwordChangedAt: new Date() });
  await db.delete(users).where(eq(users.id, MISSING_USER_ID));
});

function createApp() {
  const app = new Hono<{ Variables: { userId: string | null } }>();

  app.use(requireUserAuth);
  app.get("/", (c) => c.json({ userId: c.get("userId") }));
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  });

  return app;
}

describe("requireUserAuth middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const app = createApp();
    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  it("returns 401 when bearer token is invalid", async () => {
    const app = createApp();
    const response = await app.request("/", {
      headers: {
        Authorization: "Bearer this-is-not-a-valid-jwt",
      },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  it("allows request and sets userId when bearer token is valid", async () => {
    const app = createApp();
    const token = await sign({ sub: USER_ID }, config.jwt.accessSecret);

    const response = await app.request("/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: USER_ID });
  });

  it("returns 401 when bearer token is expired", async () => {
    const app = createApp();
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: USER_ID, iat: now - 120, exp: now - 60 },
      config.jwt.accessSecret,
      "HS256",
    );

    const response = await app.request("/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  async function requestWithToken(
    userId: string,
    claims: { iat?: number } = {},
  ) {
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: userId, iat: claims.iat ?? now, exp: now + 3600 },
      config.jwt.accessSecret,
      "HS256",
    );
    return createApp().request("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  it("returns 401 when the user is deleted", async () => {
    const response = await requestWithToken(DELETED_USER_ID);
    expect(response.status).toBe(401);
  });

  it("returns 401 when the user no longer exists", async () => {
    const response = await requestWithToken(MISSING_USER_ID);
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token issued before the password change", async () => {
    const response = await requestWithToken(CHANGED_USER_ID, {
      iat: Math.floor(Date.now() / 1000) - 3600,
    });
    expect(response.status).toBe(401);
  });
});
