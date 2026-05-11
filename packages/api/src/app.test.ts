import { beforeAll, describe, expect, it } from "bun:test";

let app: typeof import("./app")["default"];

beforeAll(async () => {
  process.env.DATABASE_URL ??=
    "postgres://postgres:postgres@localhost:5432/loyalty_hive";
  process.env.JWT_ACCESS_SECRET ??= "test-secret";
  process.env.SENTRY_DSN ??= "";

  ({ default: app } = await import("./app"));
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
          title: "Loyalty Hive API",
          version: "1.0.0",
        }),
      }),
    );
    expect(document.servers).toBeArray();
  });
});
