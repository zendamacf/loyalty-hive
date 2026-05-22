import "../test/env";
import { beforeAll, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { signTestToken } from "../test/create-app";
import { users } from "./db/schema";

const packageVersion = JSON.parse(
  readFileSync(resolve(import.meta.dir, "../package.json"), "utf8"),
).version as string;

const SMOKE_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

process.env.SENTRY_DSN ??= "";

let app: typeof import("./app")["default"];
let db: typeof import("./db/client")["db"];

beforeAll(async () => {
  ({ db } = await import("./db/client"));
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

async function fetchOpenApiDoc(path: string) {
  const response = await app.request(path);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  return response.json();
}

describe("app", () => {
  it("serves public OpenAPI document at /doc", async () => {
    const document = await fetchOpenApiDoc("/doc");

    expect(document.servers).toEqual([
      {
        url: "https://loyaltyhive.kalopsia.dev",
        description: "Production server",
      },
    ]);
  });

  it("serves codegen OpenAPI document at /doc/gen", async () => {
    const document = await fetchOpenApiDoc("/doc/gen");

    expect(document.servers).toEqual([
      {
        url: "https://rut-roman-cubicle.ngrok-free.dev",
        description: "Local server",
      },
      {
        url: "https://loyaltyhive.kalopsia.dev",
        description: "Production server",
      },
    ]);
  });

  it("serves Swagger UI at /", async () => {
    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("/doc");
  });

  it("includes basic OpenAPI metadata on public and codegen docs", async () => {
    for (const path of ["/doc", "/doc/gen"] as const) {
      const document = await fetchOpenApiDoc(path);

      expect(document).toEqual(
        expect.objectContaining({
          openapi: expect.any(String),
          info: expect.objectContaining({
            title: "LoyaltyHive API",
            version: packageVersion,
          }),
        }),
      );
      expect(document.components.securitySchemes).toEqual(
        expect.objectContaining({
          apiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key",
          },
          bearerAuth: expect.objectContaining({
            type: "http",
            scheme: "bearer",
          }),
        }),
      );
    }
  });

  it("documents login route security in the public OpenAPI spec", async () => {
    const document = await fetchOpenApiDoc("/doc");

    const login = document.paths["/api/v1/auth/login"]?.post;
    expect(login?.security).toEqual([{ apiKeyAuth: [] }]);
    expect(login?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: "header",
          name: "x-api-key",
          required: true,
        }),
      ]),
    );
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
