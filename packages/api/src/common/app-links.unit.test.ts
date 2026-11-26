import { describe, expect, it } from "bun:test";

import { buildAppDeepLink, buildEmailLink } from "./app-links.js";

describe("[Unit] app links", () => {
  it("builds a deep link with an encoded token", () => {
    expect(buildAppDeepLink("verify-email", "a+b=", "loyaltyhive://")).toBe(
      "loyaltyhive://verify-email?token=a%2Bb%3D",
    );
  });

  it("builds an Expo Go deep link from the configured base", () => {
    expect(
      buildAppDeepLink("reset-password", "abc", "exp://192.168.1.20:8081/--/"),
    ).toBe("exp://192.168.1.20:8081/--/reset-password?token=abc");
  });

  it("links emails to the API redirect when a base URL is set", () => {
    expect(
      buildEmailLink("verify-email", "a+b=", "https://api.example.com"),
    ).toBe("https://api.example.com/links/verify-email?token=a%2Bb%3D");
  });

  it("falls back to the deep link without a base URL", () => {
    expect(buildEmailLink("reset-password", "abc", "")).toEndWith(
      "reset-password?token=abc",
    );
  });
});
