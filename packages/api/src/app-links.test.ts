import { describe, expect, it } from "bun:test";

import { createAppLinksApp } from "./app-links";

const app = createAppLinksApp("exp://192.168.1.20:8081/--/");

describe("app link redirects", () => {
  it("redirects verify-email to the deep link", async () => {
    const response = await app.request("/links/verify-email?token=a%2Bb");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "exp://192.168.1.20:8081/--/verify-email?token=a%2Bb",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("redirects reset-password to the deep link", async () => {
    const response = await app.request("/links/reset-password?token=abc");
    expect(response.headers.get("location")).toBe(
      "exp://192.168.1.20:8081/--/reset-password?token=abc",
    );
  });

  it("returns 400 without a token", async () => {
    const response = await app.request("/links/verify-email");
    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown target", async () => {
    const response = await app.request("/links/other?token=abc");
    expect(response.status).toBe(404);
  });
});
