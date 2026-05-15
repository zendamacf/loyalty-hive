import { beforeAll, describe, expect, it } from "bun:test";
import { createApiRouterApp, signTestToken } from "../../test/create-app";
import { config } from "../common/config";
import { db } from "../db/client";
import { brands, users } from "../db/schema";

const USER_ID = "44444444-4444-4444-8444-444444444444";
const BRAND_A_ID = "55555555-5555-4555-8555-555555555555";
const BRAND_B_ID = "66666666-6666-4666-8666-666666666666";

let authToken: string;

beforeAll(async () => {
  authToken = await signTestToken(USER_ID);

  await db
    .insert(users)
    .values({
      id: USER_ID,
      email: "brands.tester@example.com",
      passwordHash: "hashed-password",
    })
    .onConflictDoNothing();

  await db
    .insert(brands)
    .values([
      {
        id: BRAND_B_ID,
        name: "Beta Brand",
        logoFile: "beta.png",
        backgroundColor: "#000000",
      },
      {
        id: BRAND_A_ID,
        name: "Alpha Brand",
        logoFile: "alpha.png",
        backgroundColor: "#000000",
      },
    ])
    .onConflictDoNothing();
});

describe("brands routes", () => {
  it("requires authentication", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/brands");

    expect(response.status).toBe(401);
  });

  it("returns brands sorted by name with logoUrl", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/brands", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      name: string;
      logoUrl: string;
      createdAt: string;
    }>;

    const ours = body.filter((b) => b.id === BRAND_A_ID || b.id === BRAND_B_ID);
    expect(ours).toHaveLength(2);
    expect(ours[0].name).toBe("Alpha Brand");
    expect(ours[1].name).toBe("Beta Brand");
    expect(ours[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(ours[0].logoUrl).toBe(
      `${config.server.fileStorageUrl}logos/alpha.png`,
    );
    expect(ours[1].logoUrl).toBe(
      `${config.server.fileStorageUrl}logos/beta.png`,
    );
  });
});
