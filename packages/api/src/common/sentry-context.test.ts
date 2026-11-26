import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
  dropExpectedErrors,
  enrichSentryScope,
  shouldReportError,
} from "./sentry-context";

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

describe("shouldReportError", () => {
  it("skips 4xx HTTP errors", () => {
    expect(shouldReportError(new HTTPException(400))).toBe(false);
    expect(shouldReportError(new HTTPException(401))).toBe(false);
    expect(shouldReportError(new HTTPException(403))).toBe(false);
    expect(shouldReportError(new HTTPException(429))).toBe(false);
  });

  it("skips validation errors", () => {
    const result = z.string().safeParse(1);
    expect(shouldReportError(result.error)).toBe(false);
  });

  it("reports 5xx HTTP errors and other errors", () => {
    expect(shouldReportError(new HTTPException(500))).toBe(true);
    expect(shouldReportError(new HTTPException(503))).toBe(true);
    expect(shouldReportError(new Error("boom"))).toBe(true);
    expect(shouldReportError(undefined)).toBe(true);
  });
});

describe("dropExpectedErrors", () => {
  it("drops events for 4xx errors and keeps others", () => {
    const event = { message: "x" };
    expect(
      dropExpectedErrors(event, { originalException: new HTTPException(401) }),
    ).toBeNull();
    expect(
      dropExpectedErrors(event, { originalException: new Error("boom") }),
    ).toBe(event);
  });
});
