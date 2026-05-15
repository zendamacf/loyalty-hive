import { beforeAll, describe, expect, it } from "bun:test";
import { signTestToken } from "../test/create-app";
import { db } from "./db/client";
import { users } from "./db/schema";

const SMOKE_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let app: typeof import("./app")["default"];

beforeAll(async () => {
  process.env.SENTRY_DSN ??= "";

  ({ default: app } = await import("./app"));

  await db
    .insert(users)
    .values({
      id: SMOKE_USER_ID,
      email: "app.smoke@example.com",
      passwordHash: "hashed-password",
    })
    .onConflictDoNothing();
});

describe("app", () => {
  it("serves OpenAPI document at /openapi", async () => {
    const response = await app.request("/openapi");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("includes basic OpenAPI metadata", async () => {
    const response = await app.request("/openapi");
    const document = await response.json();

    expect(document).toEqual(
      expect.objectContaining({
        openapi: expect.any(String),
        info: expect.objectContaining({
          title: "LoyaltyHive API",
          version: "1.0.0",
        }),
      }),
    );
    expect(document.servers).toBeArray();
  });

  it("serves authenticated API routes through the full app", async () => {
    const token = await signTestToken(SMOKE_USER_ID);

    const response = await app.request("/api/v1/brands", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toBeArray();
  });
});
