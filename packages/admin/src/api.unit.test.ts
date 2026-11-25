import { afterEach, describe, expect, it } from "bun:test";

import { jsonResponse, mockFetch, restoreFetch } from "../test/fetch-mock";
import { ADMIN } from "../test/fixtures";
import {
  ApiError,
  getMe,
  listBrandRequests,
  listUsers,
  login,
  logout,
} from "./api";

afterEach(restoreFetch);

describe("[Unit] admin api client", () => {
  it("gets the current admin with same-origin credentials", async () => {
    const fetch = mockFetch(() => jsonResponse(ADMIN));

    expect(await getMe()).toEqual(ADMIN);

    const [input, init] = fetch.mock.calls[0] ?? [];
    expect(String(input)).toBe("/api/v1/admin/auth/me");
    expect(init?.credentials).toBe("same-origin");
  });

  it("posts the login body as JSON", async () => {
    const fetch = mockFetch(() => jsonResponse(ADMIN));

    await login("admin@example.com", "Password123456");

    const [input, init] = fetch.mock.calls[0] ?? [];
    expect(String(input)).toBe("/api/v1/admin/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "admin@example.com",
      password: "Password123456",
    });
  });

  it("returns undefined for 204 on logout", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    expect(await logout()).toBeUndefined();
  });

  it("adds limit, offset, and status to the list query", async () => {
    const fetch = mockFetch(() =>
      jsonResponse({ items: [], total: 0, limit: 10, offset: 20 }),
    );

    await listBrandRequests({ status: "approved", limit: 10, offset: 20 });
    await listBrandRequests({ limit: 50, offset: 0 });

    const urls = fetch.mock.calls.map(([input]) => String(input));
    expect(urls).toEqual([
      "/api/v1/admin/brand-requests?limit=10&offset=20&status=approved",
      "/api/v1/admin/brand-requests?limit=50&offset=0",
    ]);
  });

  it("adds search and filters to the users query", async () => {
    const fetch = mockFetch(() =>
      jsonResponse({ items: [], total: 0, limit: 50, offset: 0 }),
    );

    await listUsers({
      search: "a+b@example.com",
      status: "pending_deletion",
      verified: false,
      limit: 50,
      offset: 0,
    });
    await listUsers({ verified: true, limit: 50, offset: 50 });
    await listUsers({ limit: 50, offset: 0 });

    const urls = fetch.mock.calls.map(([input]) => String(input));
    expect(urls).toEqual([
      "/api/v1/admin/users?limit=50&offset=0&search=a%2Bb%40example.com&status=pending_deletion&verified=false",
      "/api/v1/admin/users?limit=50&offset=50&verified=true",
      "/api/v1/admin/users?limit=50&offset=0",
    ]);
  });

  it("throws ApiError with the API error message", async () => {
    mockFetch(() => jsonResponse({ error: "Invalid email or password" }, 401));

    const error = await login("a@example.com", "x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).message).toBe("Invalid email or password");
  });

  it("throws ApiError with a default message when the body is not JSON", async () => {
    mockFetch(() => new Response("Internal Server Error", { status: 500 }));

    const error = await getMe().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Request failed (500)");
  });

  it("uses the default message when the JSON body has no error string", async () => {
    mockFetch(() => jsonResponse({ message: "no" }, 400));

    const error = await getMe().catch((e: unknown) => e);
    expect((error as ApiError).message).toBe("Request failed (400)");
  });
});
