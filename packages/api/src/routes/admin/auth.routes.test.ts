import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";

import {
  adminCookieHeaders,
  createApiRouterApp,
  signTestAdminToken,
} from "../../../test/create-app";
import { config } from "../../common/config";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_PATH,
  BCRYPT_COST,
} from "../../common/constants";
import { db } from "../../db/client";
import { adminUsers } from "../../db/schema";

const app = createApiRouterApp();

const ADMIN_ID = "ad000000-0000-4000-8000-000000000101";
const DISABLED_ADMIN_ID = "ad000000-0000-4000-8000-000000000102";
const ADMIN_EMAIL = "admin-auth-routes@example.com";
const DISABLED_ADMIN_EMAIL = "admin-auth-routes-disabled@example.com";
const PASSWORD = "AdminPassword123";

async function ensureAdmin(id: string, email: string, disabledAt?: Date) {
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  await db.insert(adminUsers).values({
    id,
    email,
    passwordHash: await bcryptHash(PASSWORD, BCRYPT_COST),
    disabledAt,
  });
}

beforeAll(async () => {
  await ensureAdmin(ADMIN_ID, ADMIN_EMAIL);
  await ensureAdmin(DISABLED_ADMIN_ID, DISABLED_ADMIN_EMAIL, new Date());
});

function login(body: unknown) {
  return app.request("/api/v1/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/admin/auth/login", () => {
  const originalSecret = config.adminJwt.secret;
  afterEach(() => {
    config.adminJwt.secret = originalSecret;
  });

  it("sets an httpOnly session cookie and returns the admin", async () => {
    const response = await login({
      email: ` ${ADMIN_EMAIL.toUpperCase()} `,
      password: PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ADMIN_ID, email: ADMIN_EMAIL });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toStartWith(`${ADMIN_SESSION_COOKIE}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain(`Path=${ADMIN_SESSION_COOKIE_PATH}`);
    expect(cookie).toContain(`Max-Age=${config.adminJwt.ttlSeconds}`);
  });

  it("gives a session cookie that /me accepts", async () => {
    const response = await login({ email: ADMIN_EMAIL, password: PASSWORD });
    const cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];

    const me = await app.request("/api/v1/admin/auth/me", {
      headers: { Cookie: cookie ?? "" },
    });
    expect(me.status).toBe(200);
  });

  it("returns 401 for a wrong password", async () => {
    const response = await login({
      email: ADMIN_EMAIL,
      password: "WrongPassword123",
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns 401 for an unknown email", async () => {
    const response = await login({
      email: "no-such-admin@example.com",
      password: PASSWORD,
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password",
    });
  });

  it("returns 401 for a disabled admin with the correct password", async () => {
    const response = await login({
      email: DISABLED_ADMIN_EMAIL,
      password: PASSWORD,
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password",
    });
  });

  it("returns 400 for an invalid body", async () => {
    const response = await login({ email: "not-an-email", password: "" });
    expect(response.status).toBe(400);
  });

  it("returns 503 when ADMIN_JWT_SECRET is not set", async () => {
    config.adminJwt.secret = "";
    const response = await login({ email: ADMIN_EMAIL, password: PASSWORD });
    expect(response.status).toBe(503);
  });

  it("returns 503 when ADMIN_JWT_SECRET is the same as JWT_ACCESS_SECRET", async () => {
    config.adminJwt.secret = config.jwt.accessSecret;
    const response = await login({ email: ADMIN_EMAIL, password: PASSWORD });
    expect(response.status).toBe(503);
  });

  it("returns 429 after too many attempts for one email", async () => {
    const original = process.env.RATE_LIMIT_ADMIN_LOGIN_EMAIL_MAX;
    process.env.RATE_LIMIT_ADMIN_LOGIN_EMAIL_MAX = "2";
    try {
      const body = {
        email: "admin-rate-limit@example.com",
        password: PASSWORD,
      };
      expect((await login(body)).status).toBe(401);
      expect((await login(body)).status).toBe(401);
      const limited = await login(body);
      expect(limited.status).toBe(429);
      expect(limited.headers.get("retry-after")).not.toBeNull();
    } finally {
      process.env.RATE_LIMIT_ADMIN_LOGIN_EMAIL_MAX = original;
    }
  });
});

describe("GET /api/v1/admin/auth/me", () => {
  it("returns the current admin", async () => {
    const response = await app.request("/api/v1/admin/auth/me", {
      headers: adminCookieHeaders(await signTestAdminToken(ADMIN_ID)),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ADMIN_ID, email: ADMIN_EMAIL });
  });

  it("returns 401 without a session", async () => {
    const response = await app.request("/api/v1/admin/auth/me");
    expect(response.status).toBe(401);
  });
});

describe("POST /api/v1/admin/auth/logout", () => {
  it("clears the session cookie", async () => {
    const response = await app.request("/api/v1/admin/auth/logout", {
      method: "POST",
    });
    expect(response.status).toBe(204);

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toStartWith(`${ADMIN_SESSION_COOKIE}=;`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain(`Path=${ADMIN_SESSION_COOKIE_PATH}`);
  });
});
