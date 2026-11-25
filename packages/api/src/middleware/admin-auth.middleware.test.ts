import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";

import {
  adminCookieHeaders,
  signTestAdminToken,
  signTestToken,
} from "../../test/create-app";
import { config } from "../common/config";
import { ADMIN_JWT_AUDIENCE } from "../common/constants";
import { db } from "../db/client";
import { adminUsers } from "../db/schema";
import { type AdminEnv, requireAdmin } from "./admin-auth.middleware";

const ADMIN_ID = "ad000000-0000-4000-8000-000000000001";
const DISABLED_ADMIN_ID = "ad000000-0000-4000-8000-000000000002";
const CHANGED_ADMIN_ID = "ad000000-0000-4000-8000-000000000003";
const MISSING_ADMIN_ID = "ad000000-0000-4000-8000-000000000004";

async function ensureAdmin(
  id: string,
  extra: { disabledAt?: Date; passwordChangedAt?: Date } = {},
) {
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  await db.insert(adminUsers).values({
    id,
    email: `${id}@admin-middleware.test.example.com`,
    passwordHash: "not-used",
    ...extra,
  });
}

beforeAll(async () => {
  await ensureAdmin(ADMIN_ID);
  await ensureAdmin(DISABLED_ADMIN_ID, { disabledAt: new Date() });
  await ensureAdmin(CHANGED_ADMIN_ID, { passwordChangedAt: new Date() });
  await db.delete(adminUsers).where(eq(adminUsers.id, MISSING_ADMIN_ID));
});

function createApp() {
  const app = new Hono<AdminEnv>();
  app.use(requireAdmin);
  app.get("/", (c) => c.json({ adminId: c.get("adminId") }));
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  });
  return app;
}

async function requestWithCookie(token?: string) {
  return createApp().request("/", {
    headers: token ? adminCookieHeaders(token) : {},
  });
}

describe("requireAdmin middleware", () => {
  it("returns 401 when the session cookie is missing", async () => {
    const response = await requestWithCookie();
    expect(response.status).toBe(401);
  });

  it("allows the request and sets adminId for a valid session", async () => {
    const response = await requestWithCookie(
      await signTestAdminToken(ADMIN_ID),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ adminId: ADMIN_ID });
  });

  it("returns 401 for a malformed token", async () => {
    const response = await requestWithCookie("not-a-jwt");
    expect(response.status).toBe(401);
  });

  it("returns 401 for an app user token in the cookie", async () => {
    const response = await requestWithCookie(await signTestToken(ADMIN_ID));
    expect(response.status).toBe(401);
  });

  it("returns 401 for an app user token as a bearer header", async () => {
    const response = await createApp().request("/", {
      headers: { Authorization: `Bearer ${await signTestToken(ADMIN_ID)}` },
    });
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token signed with the admin secret but without the admin audience", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: ADMIN_ID, iat: now, exp: now + 60 },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token without a subject", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { aud: ADMIN_JWT_AUDIENCE, iat: now, exp: now + 60 },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token without exp", async () => {
    const token = await sign(
      {
        sub: ADMIN_ID,
        aud: ADMIN_JWT_AUDIENCE,
        iat: Math.floor(Date.now() / 1000),
      },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token without iat", async () => {
    const token = await sign(
      {
        sub: ADMIN_ID,
        aud: ADMIN_JWT_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: ADMIN_ID, aud: ADMIN_JWT_AUDIENCE, iat: now - 120, exp: now - 60 },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 for a disabled admin", async () => {
    const response = await requestWithCookie(
      await signTestAdminToken(DISABLED_ADMIN_ID),
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when the admin no longer exists", async () => {
    const response = await requestWithCookie(
      await signTestAdminToken(MISSING_ADMIN_ID),
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 for a token issued before the password change", async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 3600;
    const token = await sign(
      {
        sub: CHANGED_ADMIN_ID,
        aud: ADMIN_JWT_AUDIENCE,
        iat: issuedAt,
        exp: issuedAt + 7200,
      },
      config.adminJwt.secret,
      "HS256",
    );
    const response = await requestWithCookie(token);
    expect(response.status).toBe(401);
  });

  it("returns 401 when the admin secret is shorter than the minimum", async () => {
    const original = config.adminJwt.secret;
    config.adminJwt.secret = "short-secret";
    try {
      const token = await signTestAdminToken(ADMIN_ID);
      const response = await requestWithCookie(token);
      expect(response.status).toBe(401);
    } finally {
      config.adminJwt.secret = original;
    }
  });

  it("returns 401 when the admin secret is the same as the app user secret", async () => {
    const token = await signTestAdminToken(ADMIN_ID);
    const original = config.adminJwt.secret;
    config.adminJwt.secret = config.jwt.accessSecret;
    try {
      const response = await requestWithCookie(token);
      expect(response.status).toBe(401);
    } finally {
      config.adminJwt.secret = original;
    }
  });
});
