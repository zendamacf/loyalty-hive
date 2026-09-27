import { describe, expect, it } from "bun:test";
import { Hono } from "hono";

import { getClientIp } from "./client-ip";

describe("[Unit] getClientIp", () => {
  it("prefers the first x-forwarded-for address", async () => {
    const app = new Hono();
    app.get("/", (c) => c.text(getClientIp(c)));

    const response = await app.request("/", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });

    expect(await response.text()).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", async () => {
    const app = new Hono();
    app.get("/", (c) => c.text(getClientIp(c)));

    const response = await app.request("/", {
      headers: { "x-real-ip": "198.51.100.2" },
    });

    expect(await response.text()).toBe("198.51.100.2");
  });

  it("uses unknown when no proxy headers or connection info exist", async () => {
    const app = new Hono();
    app.get("/", (c) => c.text(getClientIp(c)));

    const response = await app.request("/");

    expect(await response.text()).toBe("unknown");
  });
});
