import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";

import {
  adminCookieHeaders,
  createApiRouterApp,
  signTestAdminToken,
} from "../../../test/create-app";
import { db } from "../../db/client";
import { adminUsers } from "../../db/schema";
import { ADMIN_MAX_BODY_BYTES, ADMIN_PUBLIC_PATHS } from "./admin.router";

const app = createApiRouterApp();
const ADMIN_ID = "ad000000-0000-4000-8000-000000000401";
const SAMPLE_UUID = "00000000-0000-4000-8000-000000000000";

/** Every admin API route that is registered now, so new routes are checked too. */
function registeredAdminRoutes() {
  const seen = new Set<string>();
  const routes: { method: string; path: string }[] = [];
  for (const route of app.routes) {
    if (!route.path.startsWith("/api/v1/admin/") || route.method === "ALL") {
      continue;
    }
    const path = route.path.replace(/:[^/]+/g, SAMPLE_UUID);
    const key = `${route.method} ${path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    routes.push({ method: route.method, path });
  }
  return routes;
}

let adminHeaders: Record<string, string>;

beforeAll(async () => {
  await db.delete(adminUsers).where(eq(adminUsers.id, ADMIN_ID));
  await db.insert(adminUsers).values({
    id: ADMIN_ID,
    email: "admin.router@example.com",
    passwordHash: "not-used",
  });
  adminHeaders = adminCookieHeaders(await signTestAdminToken(ADMIN_ID));
});

describe("admin router session check", () => {
  const routes = registeredAdminRoutes();
  const protectedRoutes = routes.filter(
    (route) => !ADMIN_PUBLIC_PATHS.has(route.path),
  );

  it("finds the known routes, so the checks below are not empty", () => {
    const keys = routes.map((route) => `${route.method} ${route.path}`);
    expect(keys).toContain("GET /api/v1/admin/auth/me");
    expect(keys).toContain("GET /api/v1/admin/users");
    expect(keys).toContain("GET /api/v1/admin/brand-requests");
    expect(keys).toContain("POST /api/v1/admin/auth/login");
  });

  it("has only login and logout as public paths", () => {
    expect([...ADMIN_PUBLIC_PATHS].sort()).toEqual([
      "/api/v1/admin/auth/login",
      "/api/v1/admin/auth/logout",
    ]);
  });

  for (const route of protectedRoutes) {
    it(`${route.method} ${route.path} returns 401 without a session`, async () => {
      const response = await app.request(route.path, { method: route.method });
      expect(response.status).toBe(401);
    });
  }

  it("needs a session for unknown admin paths", async () => {
    for (const path of [
      "/api/v1/admin/does-not-exist",
      "/api/v1/admin/users/",
      "/api/v1/admin/Users",
      "/api/v1/admin/%75sers",
      "/api/v1/admin/auth/login/",
      "/api/v1/admin/auth/LOGIN",
    ]) {
      const response = await app.request(path, { method: "POST" });
      expect({ path, status: response.status }).toEqual({ path, status: 401 });
    }
  });

  it("allows a request with a valid admin session", async () => {
    const response = await app.request("/api/v1/admin/auth/me", {
      headers: adminHeaders,
    });
    expect(response.status).toBe(200);
  });
});

describe("admin router responses", () => {
  it("sets Cache-Control: no-store on success and on errors", async () => {
    const ok = await app.request("/api/v1/admin/users?limit=1", {
      headers: adminHeaders,
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("no-store");

    const unauthorized = await app.request("/api/v1/admin/users");
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a body larger than the limit with 413", async () => {
    const response = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "big@example.com",
        password: "a".repeat(ADMIN_MAX_BODY_BYTES),
      }),
    });
    expect(response.status).toBe(413);
  });

  it("rejects a login password longer than 1024 characters with 400", async () => {
    const response = await app.request("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "long@example.com",
        password: "a".repeat(1025),
      }),
    });
    expect(response.status).toBe(400);
  });
});
