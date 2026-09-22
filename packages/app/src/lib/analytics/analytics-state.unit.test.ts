import { describe, expect, it } from "bun:test";

import { resolveAnalyticsIdentity } from "./analytics-state";

describe("[Unit] resolveAnalyticsIdentity", () => {
  it("identifies immediately when a persisted user id exists", () => {
    expect(
      resolveAnalyticsIdentity({
        persistedUserId: "00000000-0000-4000-8000-000000000001",
        isAuthReady: false,
        isAuthenticated: false,
        userId: null,
      }),
    ).toEqual({
      mode: "identified",
      userId: "00000000-0000-4000-8000-000000000001",
      shouldPersistUserId: false,
    });
  });

  it("stays pending until auth is ready when no persisted user id exists", () => {
    expect(
      resolveAnalyticsIdentity({
        persistedUserId: null,
        isAuthReady: false,
        isAuthenticated: false,
        userId: null,
      }),
    ).toEqual({
      mode: "pending",
      userId: null,
      shouldPersistUserId: false,
    });
  });

  it("defers tracking on the login page when auth is ready and unauthenticated", () => {
    expect(
      resolveAnalyticsIdentity({
        persistedUserId: null,
        isAuthReady: true,
        isAuthenticated: false,
        userId: null,
      }),
    ).toEqual({
      mode: "deferred",
      userId: null,
      shouldPersistUserId: false,
    });
  });

  it("identifies and persists when auth resolves a user id", () => {
    expect(
      resolveAnalyticsIdentity({
        persistedUserId: null,
        isAuthReady: true,
        isAuthenticated: true,
        userId: "00000000-0000-4000-8000-000000000002",
      }),
    ).toEqual({
      mode: "identified",
      userId: "00000000-0000-4000-8000-000000000002",
      shouldPersistUserId: true,
    });
  });

  it("stays pending while authenticated but waiting for /auth/me", () => {
    expect(
      resolveAnalyticsIdentity({
        persistedUserId: null,
        isAuthReady: true,
        isAuthenticated: true,
        userId: null,
      }),
    ).toEqual({
      mode: "pending",
      userId: null,
      shouldPersistUserId: false,
    });
  });
});
