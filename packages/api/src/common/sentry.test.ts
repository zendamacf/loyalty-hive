import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Toucan } from "toucan-js";
import { sentryMiddleware } from "./sentry";

function createApp() {
  const inner = new Hono()
    .get("/forbidden", () => {
      throw new HTTPException(403);
    })
    .get("/boom", () => {
      throw new Error("boom");
    })
    .onError((error, c) => {
      if (error instanceof HTTPException)
        return c.text("handled", error.status);
      throw error;
    });
  const app = new Hono().use(sentryMiddleware).route("/api", inner);
  app.onError((_e, c) => c.text("Internal Server Error", 500));
  return app;
}

describe("sentryMiddleware", () => {
  afterEach(() => {
    mock.restore();
  });

  it("reports an unhandled error once", async () => {
    const capture = spyOn(Toucan.prototype, "captureException");
    const res = await createApp().request("/api/boom");
    expect(res.status).toBe(500);
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it("does not report an error handled as a 4xx", async () => {
    const capture = spyOn(Toucan.prototype, "captureException");
    const res = await createApp().request("/api/forbidden");
    expect(res.status).toBe(403);
    expect(capture).not.toHaveBeenCalled();
  });
});
