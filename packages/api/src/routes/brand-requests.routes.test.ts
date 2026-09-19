import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import {
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { db } from "../db/client";
import { brandRequests, brands, users } from "../db/schema";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EXISTING_BRAND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

let app: ReturnType<typeof createApiRouterApp>;
let authToken: string;
let otherUserToken: string;

beforeAll(async () => {
  app = createApiRouterApp();
  authToken = await signTestToken(USER_ID);
  otherUserToken = await signTestToken(OTHER_USER_ID);

  await db
    .insert(users)
    .values([
      {
        id: USER_ID,
        email: "brand.request.user@example.com",
        passwordHash: "hashed-password",
      },
      {
        id: OTHER_USER_ID,
        email: "brand.request.other@example.com",
        passwordHash: "hashed-password",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(brands)
    .values({
      id: EXISTING_BRAND_ID,
      name: "Existing Brand",
      logoFile: "existing.png",
      backgroundColor: "#000000",
    })
    .onConflictDoNothing();
});

describe("brand-requests routes", () => {
  it("requires authentication", async () => {
    const response = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedName: "New Brand",
        url: "https://example.com/loyalty",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("creates a brand request", async () => {
    const response = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName: "Brand Request Create Test",
        url: "https://www.coles.com.au/loyalty",
        notes: "Popular in Australia",
      }),
    });

    expect([200, 201]).toContain(response.status);
    const body = (await response.json()) as {
      id: string;
      requestedName: string;
      url: string;
      notes: string | null;
      status: string;
      createdAt: string;
    };

    expect(body.requestedName).toBe("Brand Request Create Test");
    expect(body.url).toBe("https://www.coles.com.au/loyalty");
    expect(body.notes).toBe("Popular in Australia");
    expect(body.status).toBe("pending");
    expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns an existing pending request for the same normalized name", async () => {
    const suffix = crypto.randomUUID();
    const requestedName = `Idempotent Brand ${suffix}`;

    const first = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName,
        url: "https://example.com/idempotent-brand",
      }),
    });

    const second = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName: `  ${requestedName.toUpperCase()} `,
        url: "https://example.com/idempotent-brand-updated",
      }),
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    const firstBody = (await first.json()) as { id: string };
    const secondBody = (await second.json()) as { id: string };
    expect(secondBody.id).toBe(firstBody.id);
  });

  it("rejects requests when the brand already exists", async () => {
    const response = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName: "existing brand",
        url: "https://example.com/existing",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Brand already exists in the catalog",
    });
  });

  it("rejects invalid URLs", async () => {
    const response = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName: "Invalid URL Brand",
        url: "not-a-url",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("scopes pending requests to the authenticated user", async () => {
    await db
      .delete(brandRequests)
      .where(eq(brandRequests.normalizedName, "woolworths"));

    const response = await app.request("/api/v1/brand-requests", {
      method: "POST",
      headers: {
        ...authBearerHeaders(otherUserToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedName: "Woolworths",
        url: "https://www.woolworths.com.au/rewards",
      }),
    });

    expect(response.status).toBe(201);
  });
});
