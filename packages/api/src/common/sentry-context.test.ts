import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { enrichSentryScope } from "./sentry-context";

describe("enrichSentryScope", () => {
  it("adds client tags and context from request headers", async () => {
    const setTag = mock(() => {});
    const setContext = mock(() => {});
    const setUser = mock(() => {});

    const app = new Hono<{ Variables: { userId?: string } }>();
    app.get("/", (c) => {
      enrichSentryScope(
        { setTag, setContext, setUser, captureException: mock(() => {}) },
        c,
        "user-123",
      );
      return c.text("ok");
    });

    const response = await app.request("/", {
      headers: {
        "x-client-id": "loyaltyhive-app",
        "x-app-version": "1.1.8",
        "x-app-build": "11",
        "x-app-platform": "ios",
        "x-request-id": "req-123",
        "x-os-version": "iOS 18.2",
        "user-agent": "LoyaltyHive/1.1.8",
      },
    });

    expect(response.status).toBe(200);
    expect(setTag).toHaveBeenCalledWith("client.id", "loyaltyhive-app");
    expect(setTag).toHaveBeenCalledWith("app.version", "1.1.8");
    expect(setTag).toHaveBeenCalledWith("app.platform", "ios");
    expect(setTag).toHaveBeenCalledWith("request.id", "req-123");
    expect(setTag).toHaveBeenCalledWith("app.os_version", "iOS 18.2");
    expect(setContext).toHaveBeenCalledWith("client", {
      id: "loyaltyhive-app",
      version: "1.1.8",
      build: "11",
      platform: "ios",
      osVersion: "iOS 18.2",
      userAgent: "LoyaltyHive/1.1.8",
    });
    expect(setContext).toHaveBeenCalledWith("request", {
      id: "req-123",
      method: "GET",
      path: "/",
    });
    expect(setUser).toHaveBeenCalledWith({ id: "user-123" });
  });
});
