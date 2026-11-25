import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createAdminPanelApp } from "./admin-panel";

const INDEX_HTML = '<!doctype html><div id="root"></div>';

let distDir: string;
let app: ReturnType<typeof createAdminPanelApp>;

beforeAll(async () => {
  distDir = await mkdtemp(join(tmpdir(), "admin-dist-"));
  await mkdir(join(distDir, "assets"));
  await writeFile(join(distDir, "index.html"), INDEX_HTML);
  await writeFile(join(distDir, "assets", "index-abc123.js"), "console.log(1)");
  await writeFile(join(distDir, "favicon.svg"), "<svg></svg>");
  app = createAdminPanelApp(distDir);
});

afterAll(async () => {
  await rm(distDir, { recursive: true, force: true });
});

describe("admin panel static files", () => {
  it("redirects /admin to /admin/", async () => {
    const response = await app.request("/admin");
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/admin/");
  });

  it("serves index.html at /admin/ with no-cache and security headers", async () => {
    const response = await app.request("/admin/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(await response.text()).toBe(INDEX_HTML);
  });

  it("serves hashed assets with a long cache", async () => {
    const response = await app.request("/admin/assets/index-abc123.js");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("javascript");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("returns 404 for a missing asset, not index.html", async () => {
    const response = await app.request("/admin/assets/missing.js");
    expect(response.status).toBe(404);
  });

  it("serves other files from the build with no-cache", async () => {
    const response = await app.request("/admin/favicon.svg");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toBe("<svg></svg>");
  });

  it("serves index.html for client-side routes", async () => {
    const response = await app.request("/admin/brand-requests/123");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(await response.text()).toBe(INDEX_HTML);
  });

  it("does not serve files outside the build directory", async () => {
    const response = await app.request("/admin/..%2f..%2fetc%2fpasswd");
    const body = await response.text();
    expect(body).not.toContain("root:");
  });

  it("does not handle other paths", async () => {
    expect((await app.request("/administrator")).status).toBe(404);
    expect((await app.request("/api/v1/admin/auth/me")).status).toBe(404);
  });

  it("returns 404 when the build is missing", async () => {
    const missing = createAdminPanelApp(join(distDir, "does-not-exist"));
    expect((await missing.request("/admin/")).status).toBe(404);
    expect((await missing.request("/admin/brand-requests")).status).toBe(404);
  });
});
