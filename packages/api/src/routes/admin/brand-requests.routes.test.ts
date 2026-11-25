import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import {
  adminCookieHeaders,
  authBearerHeaders,
  createApiRouterApp,
  signTestAdminToken,
  signTestToken,
} from "../../../test/create-app";
import { upsertVerifiedTestUsers } from "../../../test/upsert-test-users";
import { db } from "../../db/client";
import { adminUsers, brandRequests } from "../../db/schema";
import { ADMIN_BRAND_REQUESTS_MAX_LIMIT } from "./brand-requests.routes";

const app = createApiRouterApp();

const ADMIN_ID = "ad000000-0000-4000-8000-000000000201";
const USER_ID = "ad000000-0000-4000-8000-000000000211";
const USER_EMAIL = "admin.brand.requests.user@example.com";

const PENDING_OLD_ID = "ad000000-0000-4000-8000-000000000221";
const PENDING_NEW_ID = "ad000000-0000-4000-8000-000000000222";
const APPROVED_ID = "ad000000-0000-4000-8000-000000000223";
const REJECTED_ID = "ad000000-0000-4000-8000-000000000224";
const SEEDED_IDS = [PENDING_OLD_ID, PENDING_NEW_ID, APPROVED_ID, REJECTED_ID];

const PATH = "/api/v1/admin/brand-requests";

type ListResponse = {
  items: {
    id: string;
    requestedName: string;
    url: string;
    notes: string | null;
    status: "pending" | "approved" | "rejected";
    brandId: string | null;
    createdAt: string;
    user: { id: string; email: string };
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
    email: "admin.brand.requests@example.com",
    passwordHash: "not-used",
  });
  adminHeaders = adminCookieHeaders(await signTestAdminToken(ADMIN_ID));

  await upsertVerifiedTestUsers({
    id: USER_ID,
    email: USER_EMAIL,
    passwordHash: "hashed-password",
  });

  await db.delete(brandRequests).where(inArray(brandRequests.id, SEEDED_IDS));
  // Future dates keep the seeded rows at the top of the default sort.
  const base = Date.now() + 24 * 60 * 60 * 1000;
  await db.insert(brandRequests).values([
    {
      id: PENDING_OLD_ID,
      userId: USER_ID,
      requestedName: "Admin List Old",
      normalizedName: "admin list old",
      url: "https://old.example.com",
      notes: "Old request",
      createdAt: new Date(base),
    },
    {
      id: PENDING_NEW_ID,
      userId: USER_ID,
      requestedName: "Admin List New",
      normalizedName: "admin list new",
      url: "https://new.example.com",
      createdAt: new Date(base + 3000),
    },
    {
      id: APPROVED_ID,
      userId: USER_ID,
      requestedName: "Admin List Approved",
      normalizedName: "admin list approved",
      url: "https://approved.example.com",
      status: "approved",
      createdAt: new Date(base + 2000),
    },
    {
      id: REJECTED_ID,
      userId: USER_ID,
      requestedName: "Admin List Rejected",
      normalizedName: "admin list rejected",
      url: "https://rejected.example.com",
      status: "rejected",
      createdAt: new Date(base + 1000),
    },
  ]);
});

afterAll(async () => {
  await db.delete(brandRequests).where(inArray(brandRequests.id, SEEDED_IDS));
});

async function list(query = "", headers = adminHeaders) {
  return app.request(`${PATH}${query}`, { headers });
}

function seededIds(body: ListResponse) {
  return body.items
    .map((item) => item.id)
    .filter((id) => SEEDED_IDS.includes(id));
}

describe("GET /api/v1/admin/brand-requests", () => {
  it("returns 401 without an admin session", async () => {
    const response = await list("", {});
    expect(response.status).toBe(401);
  });

  it("returns 401 for an app user token", async () => {
    const response = await list(
      "",
      authBearerHeaders(await signTestToken(USER_ID)),
    );
    expect(response.status).toBe(401);
  });

  it("lists requests from all statuses, newest first, with the requester", async () => {
    const response = await list();
    expect(response.status).toBe(200);

    const body = (await response.json()) as ListResponse;
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
    expect(body.total).toBeGreaterThanOrEqual(SEEDED_IDS.length);
    expect(seededIds(body)).toEqual([
      PENDING_NEW_ID,
      APPROVED_ID,
      REJECTED_ID,
      PENDING_OLD_ID,
    ]);

    const old = body.items.find((item) => item.id === PENDING_OLD_ID);
    expect(old).toEqual({
      id: PENDING_OLD_ID,
      requestedName: "Admin List Old",
      url: "https://old.example.com",
      notes: "Old request",
      status: "pending",
      brandId: null,
      createdAt: expect.any(String),
      user: { id: USER_ID, email: USER_EMAIL },
    });
  });

  it("filters by status", async () => {
    const response = await list("?status=pending");
    expect(response.status).toBe(200);

    const body = (await response.json()) as ListResponse;
    expect(body.items.every((item) => item.status === "pending")).toBe(true);
    expect(seededIds(body)).toEqual([PENDING_NEW_ID, PENDING_OLD_ID]);

    const [all, approved, rejected] = await Promise.all(
      ["", "?status=approved", "?status=rejected"].map(async (query) => {
        const res = await list(query);
        return ((await res.json()) as ListResponse).total;
      }),
    );
    expect(body.total + (approved ?? 0) + (rejected ?? 0)).toBe(all ?? -1);
  });

  it("pages with limit and offset", async () => {
    const first = (await (
      await list("?limit=1&offset=0")
    ).json()) as ListResponse;
    const second = (await (
      await list("?limit=1&offset=1")
    ).json()) as ListResponse;

    expect(first.limit).toBe(1);
    expect(first.items.map((item) => item.id)).toEqual([PENDING_NEW_ID]);
    expect(second.offset).toBe(1);
    expect(second.items.map((item) => item.id)).toEqual([APPROVED_ID]);
    expect(second.total).toBe(first.total);
  });

  it("returns 400 for an invalid query", async () => {
    for (const query of [
      "?status=unknown",
      "?limit=0",
      `?limit=${ADMIN_BRAND_REQUESTS_MAX_LIMIT + 1}`,
      "?offset=-1",
      "?limit=abc",
    ]) {
      const response = await list(query);
      expect(response.status).toBe(400);
    }
  });
});
