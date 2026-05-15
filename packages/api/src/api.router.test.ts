import { describe, expect, it } from "bun:test";
import { createApiRouterApp, signTestToken } from "../test/create-app";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("api router", () => {
  it("returns JSON error for HTTPException from protected routes", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/cards");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  it("returns JSON error for invalid login credentials", async () => {
    const app = createApiRouterApp();
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@example.com",
        password: "wrong",
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password",
    });
  });

  it("returns validation error shape for invalid cards body", async () => {
    const app = createApiRouterApp();
    const token = await signTestToken(USER_ID);

    const response = await app.request("/api/v1/cards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brandId: "not-a-uuid",
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
