import { beforeAll, describe, expect, it } from "bun:test";
import {
  apiKeyHeaders,
  createApiRouterApp,
  signTestToken,
} from "../test/create-app";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let app: ReturnType<typeof createApiRouterApp>;

describe("api router", () => {
  beforeAll(() => {
    app = createApiRouterApp();
  });

  it("returns JSON error for HTTPException from protected routes", async () => {
    const response = await app.request("/api/v1/cards");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "You must be logged in to access this resource",
    });
  });

  it("returns JSON error for invalid login credentials", async () => {
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: apiKeyHeaders({ "Content-Type": "application/json" }),
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
    expect(body).toMatchObject({
      success: false,
      data: { brandId: "not-a-uuid" },
    });
    expect(body.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["cardNumber"] }),
        expect.objectContaining({ path: ["brandId"] }),
      ]),
    );
  });
});
