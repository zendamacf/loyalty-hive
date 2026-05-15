import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { signTestToken } from "../../test/create-app";
import { config } from "../common/config";
import { db } from "../db/client";
import { brands, cards, users } from "../db/schema";
import cardsRouter from "./cards.routes";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "77777777-7777-4777-8777-777777777777";
const CARD_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_USER_CARD_ID = "88888888-8888-4888-8888-888888888888";
const BRAND_ID = "33333333-3333-4333-8333-333333333333";
const UNKNOWN_CARD_ID = "00000000-0000-4000-8000-000000000099";
const UNKNOWN_BRAND_ID = "99999999-9999-4999-8999-999999999999";

let authToken: string;
let otherUserToken: string;

function createApiApp() {
  const app = new Hono();
  app.route("/api/v1/cards", cardsRouter);
  return app;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
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
      defaultView: "1D",
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
        brandId: BRAND_ID,
      },
      {
        id: OTHER_USER_CARD_ID,
        userId: OTHER_USER_ID,
        cardNumber: "1111222233334444",
        label: "Other",
        brandId: BRAND_ID,
      },
    ])
    .onConflictDoNothing();
});

describe("cards routes", () => {
  it("requires authentication for card routes", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/cards");

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's cards with enriched brand", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
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
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
  });

  it("returns 400 when request body fails cardWriteSchema validation", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
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
    const app = createApiApp();

    const response = await app.request("/api/v1/cards/not-a-uuid", {
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(400);
  });

  it("returns a card by id with enriched brand and view", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${CARD_ID}`, {
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      id: CARD_ID,
      userId: USER_ID,
      cardNumber: "4242424242424242",
      label: "Personal",
      view: "1D",
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
    expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 404 when card id does not exist", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${UNKNOWN_CARD_ID}`, {
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("returns 404 when accessing another user's card", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${OTHER_USER_CARD_ID}`, {
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("creates a card without brandId and returns brand null", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
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
      brand: null,
    });
  });

  it("creates a card with brand and returns nested brand with logoUrl", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
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
      brand: {
        id: BRAND_ID,
        name: "Test Brand",
        logoUrl: `${config.server.fileStorageUrl}logos/testbrand.png`,
        backgroundColor: "#000000",
      },
    });
  });

  it("returns 400 when brandId does not exist on create", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
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

  it("updates brandId on put", async () => {
    const app = createApiApp();
    const createRes = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "put-test-card-number",
        label: "Before update",
      }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const response = await app.request(`/api/v1/cards/${id}`, {
      method: "PUT",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "put-test-card-number",
        brandId: BRAND_ID,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id,
      brand: { id: BRAND_ID },
    });
  });

  it("does not update cardNumber or label on put", async () => {
    const app = createApiApp();
    const createRes = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "immutable-card-number",
        label: "Original label",
      }),
    });
    const { id } = (await createRes.json()) as { id: string };

    await app.request(`/api/v1/cards/${id}`, {
      method: "PUT",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "changed-number",
        label: "Changed label",
        brandId: BRAND_ID,
      }),
    });

    const [row] = await db.select().from(cards).where(eq(cards.id, id));
    expect(row.cardNumber).toBe("immutable-card-number");
    expect(row.label).toBe("Original label");
  });

  it("returns 404 on put for missing card", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${UNKNOWN_CARD_ID}`, {
      method: "PUT",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "unused",
        brandId: BRAND_ID,
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("returns 404 on put for another user's card", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${OTHER_USER_CARD_ID}`, {
      method: "PUT",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "1111222233334444",
        brandId: BRAND_ID,
      }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 on put when brandId does not exist", async () => {
    const app = createApiApp();
    const createRes = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "put-fk-test-number",
        label: "FK test",
      }),
    });
    const { id } = (await createRes.json()) as { id: string };

    const response = await app.request(`/api/v1/cards/${id}`, {
      method: "PUT",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "put-fk-test-number",
        brandId: UNKNOWN_BRAND_ID,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Referenced userId or brandId does not exist",
    });
  });

  it("returns 404 on delete for non-existent card", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${UNKNOWN_CARD_ID}`, {
      method: "DELETE",
      headers: authHeaders(authToken),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Card not found" });
  });

  it("deletes a card and allows creating another", async () => {
    const app = createApiApp();
    const deleteCardId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab";

    await db.insert(cards).values({
      id: deleteCardId,
      userId: USER_ID,
      cardNumber: "delete-me-424242424242",
      label: "Disposable",
      brandId: BRAND_ID,
    });

    const deleteResponse = await app.request(`/api/v1/cards/${deleteCardId}`, {
      method: "DELETE",
      headers: authHeaders(authToken),
    });

    expect(deleteResponse.status).toBe(204);

    const createResponse = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardNumber: "recreated-after-delete",
        label: "Recreated",
        brandId: BRAND_ID,
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      userId: USER_ID,
      cardNumber: "recreated-after-delete",
      label: "Recreated",
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
      brandId: BRAND_ID,
    });
  });

  it("other user cannot delete another user's card", async () => {
    const app = createApiApp();

    const response = await app.request(`/api/v1/cards/${CARD_ID}`, {
      method: "DELETE",
      headers: authHeaders(otherUserToken),
    });

    expect(response.status).toBe(404);
  });
});
