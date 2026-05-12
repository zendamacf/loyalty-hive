import { beforeAll, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { config } from "../common/config";
import { db } from "../db/client";
import { brands, users } from "../db/schema";
import brandsRouter from "./brands.routes";

const USER_ID = "44444444-4444-4444-8444-444444444444";
const BRAND_A_ID = "55555555-5555-4555-8555-555555555555";
const BRAND_B_ID = "66666666-6666-4666-8666-666666666666";

let authToken: string;

function createApiApp() {
  const app = new Hono();
  app.route("/api/v1/brands", brandsRouter);
  return app;
}

beforeAll(async () => {
  authToken = await sign({ sub: USER_ID }, config.jwt.accessSecret);

  await db.insert(users).values({
    id: USER_ID,
    email: "brands.tester@example.com",
    passwordHash: "hashed-password",
  });

  await db.insert(brands).values([
    {
      id: BRAND_B_ID,
      name: "Beta Brand",
      logoUrl: "https://example.com/beta",
      defaultView: "2D",
    },
    {
      id: BRAND_A_ID,
      name: "Alpha Brand",
      logoUrl: "https://example.com/alpha",
      defaultView: null,
    },
  ]);
});

describe("brands routes", () => {
  it("requires authentication", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/brands");

    expect(response.status).toBe(401);
  });

  it("returns brands sorted by name", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/brands", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      name: string;
      logoUrl: string;
      defaultView: string | null;
      createdAt: string;
    }>;

    const ours = body.filter((b) => b.id === BRAND_A_ID || b.id === BRAND_B_ID);
    expect(ours).toHaveLength(2);
    expect(ours[0].name).toBe("Alpha Brand");
    expect(ours[1].name).toBe("Beta Brand");
    expect(ours[0].defaultView).toBeNull();
    expect(ours[1].defaultView).toBe("2D");
    expect(ours[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
