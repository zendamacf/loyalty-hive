import { afterEach, describe, expect, it } from "bun:test";

import { adminAuthConfigProblem, isAdminAuthConfigured } from "./admin-session";
import { config } from "./config";

const originalSecret = config.adminJwt.secret;

afterEach(() => {
  config.adminJwt.secret = originalSecret;
});

describe("adminAuthConfigProblem", () => {
  it("returns null for a long, separate secret", () => {
    config.adminJwt.secret = "x".repeat(32);
    expect(adminAuthConfigProblem()).toBeNull();
    expect(isAdminAuthConfigured()).toBe(true);
  });

  it("explains each problem", () => {
    config.adminJwt.secret = "";
    expect(adminAuthConfigProblem()).toBe("ADMIN_JWT_SECRET is not set");

    config.adminJwt.secret = "x".repeat(31);
    expect(adminAuthConfigProblem()).toBe(
      "ADMIN_JWT_SECRET must have at least 32 characters",
    );

    config.adminJwt.secret = config.jwt.accessSecret.padEnd(32, "x");
    const shared = config.adminJwt.secret;
    const originalAccess = config.jwt.accessSecret;
    config.jwt.accessSecret = shared;
    try {
      expect(adminAuthConfigProblem()).toBe(
        "ADMIN_JWT_SECRET must be different from JWT_ACCESS_SECRET",
      );
      expect(isAdminAuthConfigured()).toBe(false);
    } finally {
      config.jwt.accessSecret = originalAccess;
    }
  });
});
