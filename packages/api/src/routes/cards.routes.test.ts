import { beforeAll, describe, expect, it } from "bun:test";
import { eq, sql } from "drizzle-orm";
import {
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { config } from "../common/config";
import { db } from "../db/client";
import { brands, cards, users } from "../db/schema";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "77777777-7777-4777-8777-777777777777";
const CARD_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_USER_CARD_ID = "88888888-8888-4888-8888-888888888888";
const BRAND_ID = "33333333-3333-4333-8333-333333333333";
const UNKNOWN_CARD_ID = "00000000-0000-4000-8000-000000000099";
const UNKNOWN_BRAND_ID = "99999999-9999-4999-8999-999999999999";
const SORT_CARD_ALPHA = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SORT_CARD_ZEBRA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SORT_CARD_MOST_VIEWED = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const SORT_CARD_LEAST_VIEWED = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const SORT_CARD_RECENT = "11111111-1111-4111-8111-111111111112";
const SORT_CARD_OLDER = "22222222-2222-4222-8222-222222222223";
const SORT_CARD_NEVER_VIEWED = "33333333-3333-4333-8333-333333333334";

let app: ReturnType<typeof createApiRouterApp>;
let authToken: string;
let otherUserToken: string;

function relativeOrder(ids: string[], orderedIds: string[]) {
  const indices = orderedIds.map((id) => ids.indexOf(id));
  for (const index of indices) {
    expect(index).toBeGreaterThanOrEqual(0);
  }
  for (let i = 1; i < indices.length; i++) {
    expect(indices[i - 1]).toBeLessThan(indices[i]);
  }
}

beforeAll(async () => {
  app = createApiRouterApp();
  authToken = await signTestToken(USER_ID);
  otherUserToken = await signTestToken(OTHER_USER_ID);

  await db
    .insert(users)
    .values([
      {
        id: USER_ID,
        email: "test.user@example.com",
        passwordHash: "hashed-password",
      },
      {
        id: OTHER_USER_ID,
        email: "other.user@example.com",
        passwordHash: "hashed-password",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(brands)
    .values({
      id: BRAND_ID,
      name: "Test Brand",
      logoFile: "testbrand.png",
      backgroundColor: "#000000",
    })
    .onConflictDoNothing();

  await db
    .insert(cards)
    .values([
      {
        id: CARD_ID,
        userId: USER_ID,
        cardNumber: "4242424242424242",
        label: "Personal",
        view: "1D",
        brandId: BRAND_ID,
        viewCount: 0,
        lastViewedAt: null,
      },
      {
        id: OTHER_USER_CARD_ID,
        userId: OTHER_USER_ID,
        cardNumber: "1111222233334444",
        label: "Other",
        view: "1D",
        brandId: BRAND_ID,
        viewCount: 0,
        lastViewedAt: null,
      },
    ])
    .onConflictDoUpdate({
      target: cards.id,
      set: {
        userId: sql`excluded.user_id`,
        cardNumber: sql`excluded.card_number`,
        label: sql`excluded.label`,
        view: sql`excluded.view`,
        brandId: sql`excluded.brand_id`,
        viewCount: sql`excluded.view_count`,
        lastViewedAt: sql`excluded.last_viewed_at`,
      },
    });
});

describe("cards routes", () => {
  it("requires authentication for card routes", async () => {
    const response = await app.request("/api/v1/cards");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  it("returns the authenticated user's cards with enriched brand", async () => {
    const response = await app.request("/api/v1/cards", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      view: "1D" | "2D" | null;
      brand: {
        id: string;
        name: string;
        logoUrl: string;
        backgroundColor: string;
      } | null;
    }>;

    const card = body.find((c) => c.id === CARD_ID);
    expect(card).toMatchObject({
      id: CARD_ID,
      view: "1D",
      viewCount: 0,
      lastViewedAt: null,
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
  });

  it("returns 400 when sort query param is invalid", async () => {
    const response = await app.request("/api/v1/cards?sort=by_popularity", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 when order query param is invalid", async () => {
    const response = await app.request("/api/v1/cards?order=upward", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(400);
  });

  it("sorts cards alphabetically by default", async () => {
    await db
      .insert(cards)
      .values([
        {
          id: SORT_CARD_ZEBRA,
          userId: USER_ID,
          cardNumber: "sort-zebra",
          label: "Zebra Club",
        },
        {
          id: SORT_CARD_ALPHA,
          userId: USER_ID,
          cardNumber: "sort-alpha",
          label: "Alpha Rewards",
        },
      ])
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          userId: sql`excluded.user_id`,
          label: sql`excluded.label`,
          brandId: sql`excluded.brand_id`,
        },
      });

    const response = await app.request("/api/v1/cards", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [SORT_CARD_ALPHA, CARD_ID, SORT_CARD_ZEBRA]);
  });

  it("sorts cards alphabetically in descending order when requested", async () => {
    const response = await app.request(
      "/api/v1/cards?sort=alphabetical&order=desc",
      {
        headers: authBearerHeaders(authToken),
      },
    );

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [SORT_CARD_ZEBRA, CARD_ID, SORT_CARD_ALPHA]);
  });

  it("sorts cards by most viewed", async () => {
    await db
      .insert(cards)
      .values([
        {
          id: SORT_CARD_LEAST_VIEWED,
          userId: USER_ID,
          cardNumber: "sort-least",
          label: "Least viewed",
          viewCount: 1,
        },
        {
          id: SORT_CARD_MOST_VIEWED,
          userId: USER_ID,
          cardNumber: "sort-most",
          label: "Most viewed",
          viewCount: 99,
        },
      ])
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          userId: sql`excluded.user_id`,
          label: sql`excluded.label`,
          viewCount: sql`excluded.view_count`,
        },
      });

    const response = await app.request("/api/v1/cards?sort=most_viewed", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [SORT_CARD_MOST_VIEWED, SORT_CARD_LEAST_VIEWED]);
  });

  it("sorts cards by least viewed when most_viewed uses ascending order", async () => {
    const response = await app.request(
      "/api/v1/cards?sort=most_viewed&order=asc",
      { headers: authBearerHeaders(authToken) },
    );

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [SORT_CARD_LEAST_VIEWED, SORT_CARD_MOST_VIEWED]);
  });

  it("sorts cards by last viewed with never-viewed cards last", async () => {
    await db
      .insert(cards)
      .values([
        {
          id: SORT_CARD_OLDER,
          userId: USER_ID,
          cardNumber: "sort-older",
          label: "Older view",
          viewCount: 1,
          lastViewedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: SORT_CARD_RECENT,
          userId: USER_ID,
          cardNumber: "sort-recent",
          label: "Recent view",
          viewCount: 1,
          lastViewedAt: new Date("2025-06-01T00:00:00.000Z"),
        },
        {
          id: SORT_CARD_NEVER_VIEWED,
          userId: USER_ID,
          cardNumber: "sort-never",
          label: "Never viewed",
          viewCount: 0,
          lastViewedAt: null,
        },
      ])
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          userId: sql`excluded.user_id`,
          label: sql`excluded.label`,
          viewCount: sql`excluded.view_count`,
          lastViewedAt: sql`excluded.last_viewed_at`,
        },
      });

    const response = await app.request("/api/v1/cards?sort=last_viewed", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [
      SORT_CARD_RECENT,
      SORT_CARD_OLDER,
      SORT_CARD_NEVER_VIEWED,
    ]);
  });

  it("sorts cards by oldest viewed first when last_viewed uses ascending order", async () => {
    const response = await app.request(
      "/api/v1/cards?sort=last_viewed&order=asc",
      { headers: authBearerHeaders(authToken) },
    );

    expect(response.status).toBe(200);
    const ids = ((await response.json()) as Array<{ id: string }>).map(
      (card) => card.id,
    );
    relativeOrder(ids, [
      SORT_CARD_OLDER,
      SORT_CARD_RECENT,
      SORT_CARD_NEVER_VIEWED,
    ]);
  });

  it("returns 400 when request body fails cardWriteSchema validation", async () => {
    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "1234",
        brandId: "not-a-uuid",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 when card id path param fails idParamSchema validation", async () => {
    const response = await app.request("/api/v1/cards/not-a-uuid", {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(400);
  });

  it("returns a card by id with enriched brand and view", async () => {
    const response = await app.request(`/api/v1/cards/${CARD_ID}`, {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      id: CARD_ID,
      userId: USER_ID,
      cardNumber: "4242424242424242",
      label: "Personal",
      view: "1D",
      viewCount: 0,
      lastViewedAt: null,
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
    expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns viewCount and lastViewedAt when the card has been viewed", async () => {
    const viewedCardId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const lastViewedAt = new Date("2025-06-15T10:30:00.000Z");

    await db
      .insert(cards)
      .values({
        id: viewedCardId,
        userId: USER_ID,
        cardNumber: "viewed-card-1234",
        label: "Viewed",
        view: "2D",
        brandId: BRAND_ID,
        viewCount: 3,
        lastViewedAt,
      })
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          viewCount: sql`excluded.view_count`,
          lastViewedAt: sql`excluded.last_viewed_at`,
        },
      });

    const response = await app.request(`/api/v1/cards/${viewedCardId}`, {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: viewedCardId,
      viewCount: 3,
      lastViewedAt: lastViewedAt.toISOString(),
    });
  });

  it("returns 404 when card id does not exist", async () => {
    const response = await app.request(`/api/v1/cards/${UNKNOWN_CARD_ID}`, {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("returns 404 when accessing another user's card", async () => {
    const response = await app.request(`/api/v1/cards/${OTHER_USER_CARD_ID}`, {
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("logs a view by incrementing viewCount and setting lastViewedAt", async () => {
    await db
      .update(cards)
      .set({ viewCount: 0, lastViewedAt: null })
      .where(eq(cards.id, CARD_ID));

    const response = await app.request(`/api/v1/cards/${CARD_ID}/view`, {
      method: "POST",
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      id: CARD_ID,
      viewCount: 1,
    });
    expect(body.lastViewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const secondResponse = await app.request(`/api/v1/cards/${CARD_ID}/view`, {
      method: "POST",
      headers: authBearerHeaders(authToken),
    });

    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toMatchObject({
      id: CARD_ID,
      viewCount: 2,
    });
  });

  it("returns 404 when logging a view for a non-existent card", async () => {
    const response = await app.request(
      `/api/v1/cards/${UNKNOWN_CARD_ID}/view`,
      {
        method: "POST",
        headers: authBearerHeaders(authToken),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("returns 404 when logging a view for another user's card", async () => {
    const response = await app.request(
      `/api/v1/cards/${OTHER_USER_CARD_ID}/view`,
      {
        method: "POST",
        headers: authBearerHeaders(authToken),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("creates a card without brandId and returns brand null", async () => {
    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "9999888877776666",
        label: "No brand",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      userId: USER_ID,
      cardNumber: "9999888877776666",
      label: "No brand",
      viewCount: 0,
      lastViewedAt: null,
      brand: null,
    });
  });

  it("creates a card with brand and returns nested brand with logoUrl", async () => {
    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "5555555555554444",
        label: "Work",
        brandId: BRAND_ID,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      userId: USER_ID,
      cardNumber: "5555555555554444",
      label: "Work",
      viewCount: 0,
      lastViewedAt: null,
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
  });

  it("returns 400 when brandId does not exist on create", async () => {
    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "1234567890123456",
        brandId: UNKNOWN_BRAND_ID,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Referenced userId or brandId does not exist",
    });
  });

  it("returns 404 on delete for non-existent card", async () => {
    const response = await app.request(`/api/v1/cards/${UNKNOWN_CARD_ID}`, {
      method: "DELETE",
      headers: authBearerHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("deletes a card and allows creating another", async () => {
    const deleteCardId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab";

    await db.insert(cards).values({
      id: deleteCardId,
      userId: USER_ID,
      cardNumber: "delete-me-424242424242",
      label: "Disposable",
      view: "1D",
      brandId: BRAND_ID,
    });

    const deleteResponse = await app.request(`/api/v1/cards/${deleteCardId}`, {
      method: "DELETE",
      headers: authBearerHeaders(authToken),
    });

    expect(deleteResponse.status).toBe(204);

    const createResponse = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authBearerHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "recreated-after-delete",
        label: "Recreated",
        view: "1D",
        brandId: BRAND_ID,
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      userId: USER_ID,
      cardNumber: "recreated-after-delete",
      label: "Recreated",
      view: "1D",
      viewCount: 0,
      lastViewedAt: null,
      brand: { id: BRAND_ID },
    });

    const persisted = await db
      .select()
      .from(cards)
      .where(eq(cards.id, created.id))
      .limit(1);
    expect(persisted[0]).toMatchObject({
      userId: USER_ID,
      cardNumber: "recreated-after-delete",
      label: "Recreated",
      view: "1D",
      brandId: BRAND_ID,
    });
  });

  it("other user cannot delete another user's card", async () => {
    const response = await app.request(`/api/v1/cards/${CARD_ID}`, {
      method: "DELETE",
      headers: authBearerHeaders(otherUserToken),
    });

    expect(response.status).toBe(404);
  });
});
