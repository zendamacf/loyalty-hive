import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import {
  adminCookieHeaders,
  authBearerHeaders,
  createApiRouterApp,
  signTestAdminToken,
  signTestToken,
} from "../../../test/create-app";
import { db } from "../../db/client";
import { adminUsers, cardShares, cards, users } from "../../db/schema";
import { ADMIN_SHARES_MAX_LIMIT } from "./shares.routes";

const app = createApiRouterApp();

const ADMIN_ID = "ad000000-0000-4000-8000-000000000401";
const OWNER_ID = "ad000000-0000-4000-8000-000000000411";
const RECIPIENT_ID = "ad000000-0000-4000-8000-000000000412";
const CARD_ID = "ad000000-0000-4000-8000-000000000421";
const ACCOUNT_SHARE_ID = "ad000000-0000-4000-8000-000000000431";
const CARD_SHARE_ID = "ad000000-0000-4000-8000-000000000432";
const USER_IDS = [OWNER_ID, RECIPIENT_ID];

const PATH = "/api/v1/admin/shares";

type ListResponse = {
  items: {
    id: string;
    scope: "card" | "account";
    ownerEmail: string;
    recipientEmail: string;
    createdAt: string;
  }[];
  total: number;
  limit: number;
  offset: number;
};

let adminHeaders: Record<string, string>;

beforeAll(async () => {
  await db.delete(adminUsers).where(eq(adminUsers.id, ADMIN_ID));
  await db.insert(adminUsers).values({
    id: ADMIN_ID,
    email: "admin.shares.list@example.com",
    passwordHash: "not-used",
  });
  adminHeaders = adminCookieHeaders(await signTestAdminToken(ADMIN_ID));

  await db.delete(users).where(inArray(users.id, USER_IDS));
  await db.insert(users).values([
    {
      id: OWNER_ID,
      email: "admin-shares-owner@example.com",
      passwordHash: "x",
    },
    {
      id: RECIPIENT_ID,
      email: "admin-shares-recipient@example.com",
      passwordHash: "x",
    },
  ]);
  await db
    .insert(cards)
    .values({ id: CARD_ID, userId: OWNER_ID, cardNumber: "secret-number" });
  // Dates in the future, so these rows come first in a shared database.
  const base = Date.now() + 24 * 60 * 60 * 1000;
  await db.insert(cardShares).values([
    {
      id: CARD_SHARE_ID,
      ownerId: OWNER_ID,
      recipientId: RECIPIENT_ID,
      scope: "card",
      cardId: CARD_ID,
      createdAt: new Date(base),
    },
    {
      id: ACCOUNT_SHARE_ID,
      ownerId: OWNER_ID,
      recipientId: RECIPIENT_ID,
      scope: "account",
      createdAt: new Date(base + 1000),
    },
  ]);
});

afterAll(async () => {
  await db.delete(users).where(inArray(users.id, USER_IDS));
});

async function list(query: string, headers = adminHeaders) {
  return app.request(`${PATH}${query}`, { headers });
}

async function listBody(query: string) {
  const response = await list(query);
  expect(response.status).toBe(200);
  return (await response.json()) as ListResponse;
}

describe("GET /api/v1/admin/shares", () => {
  it("returns 401 without an admin session or with an app user token", async () => {
    expect((await list("", {})).status).toBe(401);
    const userHeaders = authBearerHeaders(await signTestToken(OWNER_ID));
    expect((await list("", userHeaders)).status).toBe(401);
  });

  it("lists shares newest first with the scope and both emails, but no card data", async () => {
    const body = await listBody("?limit=2");

    expect(body.items).toEqual([
      {
        id: ACCOUNT_SHARE_ID,
        scope: "account",
        ownerEmail: "admin-shares-owner@example.com",
        recipientEmail: "admin-shares-recipient@example.com",
        createdAt: expect.any(String),
      },
      {
        id: CARD_SHARE_ID,
        scope: "card",
        ownerEmail: "admin-shares-owner@example.com",
        recipientEmail: "admin-shares-recipient@example.com",
        createdAt: expect.any(String),
      },
    ]);
    expect(JSON.stringify(body)).not.toContain(CARD_ID);
    expect(JSON.stringify(body)).not.toContain("secret-number");
    expect(body.total).toBeGreaterThanOrEqual(2);
  });

  it("filters by scope and pages with limit and offset", async () => {
    const card = await listBody("?scope=card&limit=1");
    expect(card.items.map((item) => item.id)).toEqual([CARD_SHARE_ID]);
    expect(card.items.every((item) => item.scope === "card")).toBe(true);

    const second = await listBody("?limit=1&offset=1");
    expect(second.items.map((item) => item.id)).toEqual([CARD_SHARE_ID]);
    expect(second).toMatchObject({ limit: 1, offset: 1 });
  });

  it("returns 400 for an invalid query", async () => {
    expect((await list("?scope=other")).status).toBe(400);
    expect((await list(`?limit=${ADMIN_SHARES_MAX_LIMIT + 1}`)).status).toBe(
      400,
    );
  });
});
