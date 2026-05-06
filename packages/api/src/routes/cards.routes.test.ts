import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { config } from "../common/config";
import { db } from "../db/client";
import { brands, cards, users } from "../db/schema";
import { cardsRouter } from "./cards.routes";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CARD_ID = "22222222-2222-4222-8222-222222222222";
const BRAND_ID = "33333333-3333-4333-8333-333333333333";

let authToken: string;

function createApiApp() {
  const app = new Hono();
  app.route("/api/v1/cards", cardsRouter);
  return app;
}

beforeAll(async () => {
  authToken = await sign({ sub: USER_ID }, config.jwt.accessSecret);

  await db.insert(users).values({
    id: USER_ID,
    email: "test.user@example.com",
    passwordHash: "hashed-password",
  });

  await db.insert(brands).values({
    id: BRAND_ID,
    name: "Test Brand",
    logoUrl: "https://example.com/testbrand",
    defaultView: "1D",
  });

  await db.insert(cards).values({
    id: CARD_ID,
    userId: USER_ID,
    cardNumber: "4242424242424242",
    label: "Personal",
    brandId: BRAND_ID,
  });
});

describe("cards routes", () => {
  it("requires authentication for card routes", async () => {
    const app = createApiApp();
    const response = await app.request("/api/v1/cards");

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's cards", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: CARD_ID,
        userId: USER_ID,
        cardNumber: "4242424242424242",
        label: "Personal",
        brandId: BRAND_ID,
      }),
    ]);
  });

  it("returns 400 when request body fails cardWriteSchema validation", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "not-a-uuid",
        cardNumber: "5555555555554444",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 when card id path param fails idParamSchema validation", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards/not-a-uuid", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(400);
  });

  it("creates a new card for the authenticated user", async () => {
    const app = createApiApp();

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: USER_ID,
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
      brandId: BRAND_ID,
    });
  });

  it("creates a card after deleting the existing one", async () => {
    const app = createApiApp();

    const deleteResponse = await app.request(`/api/v1/cards/${CARD_ID}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.status).toBe(204);

    const createResponse = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: USER_ID,
        cardNumber: "5555555555554444",
        label: "Work",
        brandId: BRAND_ID,
      }),
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      userId: USER_ID,
      cardNumber: "5555555555554444",
      label: "Work",
      brandId: BRAND_ID,
    });

    const persisted = await db
      .select()
      .from(cards)
      .where(eq(cards.id, created.id))
      .limit(1);
    expect(persisted[0]).toMatchObject({
      userId: USER_ID,
      cardNumber: "5555555555554444",
      label: "Work",
      brandId: BRAND_ID,
    });
  });
});
