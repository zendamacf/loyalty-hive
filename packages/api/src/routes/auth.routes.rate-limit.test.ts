import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import { apiKeyHeaders, createApiRouterApp } from "../../test/create-app";
import { resetRateLimitStoreForTests } from "../common/rate-limit-store";

const TEST_EMAIL = "auth.test@example.com";
const VALID_SIGNUP_PASSWORD = "ValidPass1234";

describe("[Integration] auth route rate limits", () => {
  const envBackup = {
    loginIpMax: process.env.RATE_LIMIT_AUTH_LOGIN_IP_MAX,
    loginEmailMax: process.env.RATE_LIMIT_AUTH_LOGIN_EMAIL_MAX,
    signupIpMax: process.env.RATE_LIMIT_AUTH_SIGNUP_IP_MAX,
  };

  beforeEach(() => {
    resetRateLimitStoreForTests();
    process.env.RATE_LIMIT_AUTH_LOGIN_IP_MAX = "10000";
    process.env.RATE_LIMIT_AUTH_LOGIN_EMAIL_MAX = "10000";
    process.env.RATE_LIMIT_AUTH_SIGNUP_IP_MAX = "10000";
  });

  afterEach(() => {
    process.env.RATE_LIMIT_AUTH_LOGIN_IP_MAX = envBackup.loginIpMax;
    process.env.RATE_LIMIT_AUTH_LOGIN_EMAIL_MAX = envBackup.loginEmailMax;
    process.env.RATE_LIMIT_AUTH_SIGNUP_IP_MAX = envBackup.signupIpMax;
    resetRateLimitStoreForTests();
  });

  it("returns 429 when login attempts exceed the per-IP limit", async () => {
    process.env.RATE_LIMIT_AUTH_LOGIN_IP_MAX = "2";
    const app = createApiRouterApp();

    const body = JSON.stringify({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    const headers = apiKeyHeaders({
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.50",
    });

    expect(
      (
        await app.request("/api/v1/auth/login", {
          method: "POST",
          headers,
          body,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request("/api/v1/auth/login", {
          method: "POST",
          headers,
          body,
        })
      ).status,
    ).toBe(401);

    const limited = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers,
      body,
    });

    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Too many requests" });
    expect(limited.headers.get("retry-after")).toBeString();
  });

  it("returns 429 when login attempts exceed the per-email limit", async () => {
    process.env.RATE_LIMIT_AUTH_LOGIN_EMAIL_MAX = "2";
    const app = createApiRouterApp();

    const body = JSON.stringify({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    const headers = (ip: string) =>
      apiKeyHeaders({
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      });

    expect(
      (
        await app.request("/api/v1/auth/login", {
          method: "POST",
          headers: headers("203.0.113.51"),
          body,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await app.request("/api/v1/auth/login", {
          method: "POST",
          headers: headers("203.0.113.52"),
          body,
        })
      ).status,
    ).toBe(401);

    const limited = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: headers("203.0.113.53"),
      body,
    });

    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Too many requests" });
  });

  it("returns 429 when signup attempts exceed the per-IP limit", async () => {
    process.env.RATE_LIMIT_AUTH_SIGNUP_IP_MAX = "2";
    const app = createApiRouterApp();

    const headers = apiKeyHeaders({
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.60",
    });

    for (let n = 0; n < 2; n++) {
      const response = await app.request("/api/v1/auth/signup", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: `rate.limit.signup.${randomUUID()}@example.com`,
          password: VALID_SIGNUP_PASSWORD,
        }),
      });
      expect(response.status).toBe(201);
    }

    const limited = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: `rate.limit.signup.${randomUUID()}@example.com`,
        password: VALID_SIGNUP_PASSWORD,
      }),
    });

    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Too many requests" });
  });
});
