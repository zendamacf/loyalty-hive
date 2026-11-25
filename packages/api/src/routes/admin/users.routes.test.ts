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
import { adminUsers, users } from "../../db/schema";
import { ADMIN_USERS_MAX_LIMIT } from "./users.routes";

const app = createApiRouterApp();

const ADMIN_ID = "ad000000-0000-4000-8000-000000000301";
const PREFIX = "admin-users-list";

const OLD_VERIFIED_ID = "ad000000-0000-4000-8000-000000000311";
const UNVERIFIED_ID = "ad000000-0000-4000-8000-000000000312";
const DELETED_ID = "ad000000-0000-4000-8000-000000000313";
const NEWEST_ID = "ad000000-0000-4000-8000-000000000314";
const SEEDED_IDS = [OLD_VERIFIED_ID, UNVERIFIED_ID, DELETED_ID, NEWEST_ID];

const PATH = "/api/v1/admin/users";

type ListResponse = {
  items: {
    id: string;
    email: string;
    createdAt: string;
    emailVerifiedAt: string | null;
    deletedAt: string | null;
  }[];
  total: number;
  limit: number;
  offset: number;
};

let adminHeaders: Record<string, string>;

async function deleteSeeded() {
  await db.delete(users).where(inArray(users.id, SEEDED_IDS));
}

beforeAll(async () => {
  await db.delete(adminUsers).where(eq(adminUsers.id, ADMIN_ID));
  await db.insert(adminUsers).values({
    id: ADMIN_ID,
    email: "admin.users.list@example.com",
    passwordHash: "not-used",
  });
  adminHeaders = adminCookieHeaders(await signTestAdminToken(ADMIN_ID));

  await deleteSeeded();
  const base = Date.now() + 24 * 60 * 60 * 1000;
  await db.insert(users).values([
    {
      id: OLD_VERIFIED_ID,
      email: `${PREFIX}-old@example.com`,
      passwordHash: "x",
      emailVerifiedAt: new Date(base),
      createdAt: new Date(base),
    },
    {
      id: UNVERIFIED_ID,
      email: `${PREFIX}-unverified@example.com`,
      passwordHash: "x",
      createdAt: new Date(base + 1000),
    },
    {
      id: DELETED_ID,
      email: `${PREFIX}-deleted@example.com`,
      passwordHash: "x",
      emailVerifiedAt: new Date(base),
      deletedAt: new Date(base + 5000),
      createdAt: new Date(base + 2000),
    },
    {
      id: NEWEST_ID,
      email: `${PREFIX}-Newest@Example.com`,
      passwordHash: "x",
      emailVerifiedAt: new Date(base),
      createdAt: new Date(base + 3000),
    },
  ]);
});

afterAll(deleteSeeded);

async function list(query: string, headers = adminHeaders) {
  const response = await app.request(`${PATH}${query}`, { headers });
  return response;
}

async function listIds(query: string) {
  const response = await list(query);
  expect(response.status).toBe(200);
  const body = (await response.json()) as ListResponse;
  return { ids: body.items.map((item) => item.id), body };
}

describe("GET /api/v1/admin/users", () => {
  it("returns 401 without an admin session", async () => {
    expect((await list("", {})).status).toBe(401);
  });

  it("returns 401 for an app user token", async () => {
    const response = await list(
      "",
      authBearerHeaders(await signTestToken(OLD_VERIFIED_ID)),
    );
    expect(response.status).toBe(401);
  });

  it("lists users newest first with verification and deletion dates", async () => {
    const { ids, body } = await listIds(`?search=${PREFIX}`);

    expect(ids).toEqual([
      NEWEST_ID,
      DELETED_ID,
      UNVERIFIED_ID,
      OLD_VERIFIED_ID,
    ]);
    expect(body.total).toBe(4);
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);

    const deleted = body.items.find((item) => item.id === DELETED_ID);
    expect(deleted).toEqual({
      id: DELETED_ID,
      email: `${PREFIX}-deleted@example.com`,
      createdAt: expect.any(String),
      emailVerifiedAt: expect.any(String),
      deletedAt: expect.any(String),
    });
    const unverified = body.items.find((item) => item.id === UNVERIFIED_ID);
    expect(unverified?.emailVerifiedAt).toBeNull();
    expect(unverified?.deletedAt).toBeNull();
  });

  it("does not return password hashes or tokens", async () => {
    const { body } = await listIds(`?search=${PREFIX}`);
    for (const item of body.items) {
      expect(Object.keys(item).sort()).toEqual([
        "createdAt",
        "deletedAt",
        "email",
        "emailVerifiedAt",
        "id",
      ]);
    }
  });

  it("searches email case-insensitively and in the middle", async () => {
    expect((await listIds("?search=NEWEST@example")).ids).toEqual([NEWEST_ID]);
    expect((await listIds(`?search=%20${PREFIX}-old%20`)).ids).toEqual([
      OLD_VERIFIED_ID,
    ]);
  });

  it("matches % and _ in the search as normal characters", async () => {
    expect((await listIds(`?search=${PREFIX}-%25`)).ids).toEqual([]);
    expect((await listIds(`?search=${PREFIX}-___@`)).ids).toEqual([]);
    expect((await listIds(`?search=${PREFIX}%5C`)).ids).toEqual([]);
  });

  it("filters by account status", async () => {
    expect((await listIds(`?search=${PREFIX}&status=active`)).ids).toEqual([
      NEWEST_ID,
      UNVERIFIED_ID,
      OLD_VERIFIED_ID,
    ]);
    expect(
      (await listIds(`?search=${PREFIX}&status=pending_deletion`)).ids,
    ).toEqual([DELETED_ID]);
  });

  it("filters by email verification", async () => {
    expect((await listIds(`?search=${PREFIX}&verified=false`)).ids).toEqual([
      UNVERIFIED_ID,
    ]);
    expect(
      (await listIds(`?search=${PREFIX}&verified=true&status=active`)).ids,
    ).toEqual([NEWEST_ID, OLD_VERIFIED_ID]);
  });

  it("pages with limit and offset", async () => {
    const first = await listIds(`?search=${PREFIX}&limit=2&offset=0`);
    const second = await listIds(`?search=${PREFIX}&limit=2&offset=2`);

    expect(first.ids).toEqual([NEWEST_ID, DELETED_ID]);
    expect(second.ids).toEqual([UNVERIFIED_ID, OLD_VERIFIED_ID]);
    expect(second.body.total).toBe(4);
  });

  it("returns 400 for an invalid query", async () => {
    for (const query of [
      "?status=deleted",
      "?verified=yes",
      "?limit=0",
      `?limit=${ADMIN_USERS_MAX_LIMIT + 1}`,
      "?offset=-1",
      `?search=${"a".repeat(255)}`,
    ]) {
      expect((await list(query)).status).toBe(400);
    }
  });
});
