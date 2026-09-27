import { describe, expect, it } from "bun:test";
import { Hono } from "hono";

import { requestLogger } from "./request-logger.middleware";

describe("requestLogger middleware", () => {
  it("logs client IP on incoming and outgoing lines", async () => {
    const lines: string[] = [];
    const app = new Hono();
    app.use(requestLogger((line) => lines.push(line)));
    app.get("/health", (c) => c.text("ok"));

    const response = await app.request("/health", {
      headers: { "x-forwarded-for": "203.0.113.7" },
    });

    expect(response.status).toBe(200);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("<-- GET /health 203.0.113.7");
    expect(lines[1]).toMatch(/^--> GET \/health 203\.0\.113\.7 200 \d+ms$/);
  });
});
