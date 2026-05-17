import { beforeAll, describe, expect, it } from "bun:test";
import { hash as bcryptHash } from "bcryptjs";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { seedTestApiKey } from "../../test/seed-api-key";
import { API_KEY_HEADER, BCRYPT_COST, TEST_API_KEY } from "../common/constants";
import { db } from "../db/client";
import { apiKeys } from "../db/schema";
import { requireApiKey } from "./api-key.middleware";

const OTHER_API_KEY = "other-integration-secret";

function createApp() {
  const app = new Hono();
  app.use(requireApiKey);
  app.get("/", (c) => c.json({ ok: true }));
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  });
  return app;
}

beforeAll(async () => {
  await seedTestApiKey();

  const otherKeyHash = await bcryptHash(OTHER_API_KEY, BCRYPT_COST);
  await db
    .insert(apiKeys)
    .values({
      integrationName: "other-integration",
      keyHash: otherKeyHash,
    })
    .onConflictDoUpdate({
      target: apiKeys.integrationName,
      set: { keyHash: otherKeyHash },
    });
});

describe("requireApiKey middleware", () => {
  it("returns 401 when API key header is missing", async () => {
    const app = createApp();
    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "API key is required",
    });
  });

  it("returns 403 when API key does not match any stored hash", async () => {
    const app = createApp();
    const response = await app.request("/", {
      headers: { [API_KEY_HEADER]: "not-a-valid-key" },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Invalid API key",
    });
  });

  it("allows request when API key matches a stored hash", async () => {
    const app = createApp();
    const response = await app.request("/", {
      headers: { [API_KEY_HEADER]: TEST_API_KEY },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("allows request when API key matches a non-default integration", async () => {
    const app = createApp();
    const response = await app.request("/", {
      headers: { [API_KEY_HEADER]: OTHER_API_KEY },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
