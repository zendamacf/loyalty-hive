import { beforeAll, describe, expect, it } from "bun:test";

import { apiKeyHeaders, createApiRouterApp } from "../../test/create-app";
import { APP_PLATFORM_HEADER } from "../common/client-headers";
import { MINIMUM_APP_VERSIONS } from "../common/minimum-app-version";

let app: ReturnType<typeof createApiRouterApp>;

beforeAll(() => {
  app = createApiRouterApp();
});

describe("meta routes", () => {
  it("returns 401 when API key header is missing", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: { [APP_PLATFORM_HEADER]: "android" },
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "API key is required",
    });
  });

  it("returns 403 when API key is invalid", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: {
        "x-api-key": "wrong-key",
        [APP_PLATFORM_HEADER]: "android",
      },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Invalid API key",
    });
  });

  it("returns 400 when app platform header is missing", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: apiKeyHeaders(),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request input",
      issues: [
        {
          path: [APP_PLATFORM_HEADER],
          message: "A supported app platform header is required",
        },
      ],
    });
  });

  it("returns 400 when app platform header is unsupported", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: apiKeyHeaders({ [APP_PLATFORM_HEADER]: "web" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request input",
      issues: [
        {
          path: [APP_PLATFORM_HEADER],
          message: "A supported app platform header is required",
        },
      ],
    });
  });

  it("returns the android minimum app version", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: apiKeyHeaders({ [APP_PLATFORM_HEADER]: "android" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      platform: "android",
      minimumVersion: MINIMUM_APP_VERSIONS.android,
    });
  });

  it("returns the ios minimum app version", async () => {
    const response = await app.request("/api/v1/meta/app-version", {
      headers: apiKeyHeaders({ [APP_PLATFORM_HEADER]: "ios" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      platform: "ios",
      minimumVersion: MINIMUM_APP_VERSIONS.ios,
    });
  });
});
