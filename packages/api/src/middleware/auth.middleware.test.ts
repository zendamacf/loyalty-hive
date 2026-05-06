import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { config } from "../common/config";
import { requireUserAuth } from "./auth.middleware";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createApp() {
  const app = new Hono<{ Variables: { userId: string | null } }>();

  app.use(requireUserAuth);
  app.get("/", (c) => c.json({ userId: c.get("userId") }));

  return app;
}

describe("requireUserAuth middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const app = createApp();
    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(await response.text()).toContain(
      "You must be logged in to access this resource",
    );
  });

  it("returns 401 when bearer token is invalid", async () => {
    const app = createApp();
    const response = await app.request("/", {
      headers: {
        Authorization: "Bearer this-is-not-a-valid-jwt",
      },
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toContain(
      "You must be logged in to access this resource",
    );
  });

  it("allows request and sets userId when bearer token is valid", async () => {
    const app = createApp();
    const token = await sign({ sub: USER_ID }, config.jwt.accessSecret);

    const response = await app.request("/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: USER_ID });
  });
});
