import { beforeEach, describe, expect, it } from "bun:test";

import { getBearerToken, resolveClientAuth, setBearerToken } from "./setup";

describe("api-client setup", () => {
  beforeEach(() => {
    setBearerToken(undefined);
    process.env.EXPO_PUBLIC_API_KEY = "test-api-key";
  });

  it("returns EXPO_PUBLIC_API_KEY for x-api-key security", () => {
    expect(resolveClientAuth({ name: "x-api-key", type: "apiKey" })).toBe(
      "test-api-key",
    );
  });

  it("returns the stored bearer token for http bearer security", () => {
    setBearerToken("jwt-123");

    expect(resolveClientAuth({ scheme: "bearer", type: "http" })).toBe(
      "jwt-123",
    );
    expect(getBearerToken()).toBe("jwt-123");
  });

  it("clears the bearer token when set to undefined", () => {
    setBearerToken("jwt-123");
    setBearerToken(undefined);

    expect(getBearerToken()).toBeUndefined();
    expect(
      resolveClientAuth({ scheme: "bearer", type: "http" }),
    ).toBeUndefined();
  });
});
