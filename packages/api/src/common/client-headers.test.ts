import { describe, expect, it } from "bun:test";
import { parseClientRequestMetadata } from "./client-headers";

describe("parseClientRequestMetadata", () => {
  it("extracts client headers when present", () => {
    expect(
      parseClientRequestMetadata({
        "x-client-id": "loyaltyhive-app",
        "x-app-version": "1.1.8",
        "x-app-build": "11",
        "x-app-platform": "android",
        "x-request-id": "req-123",
        "x-os-version": "Android 14",
        "user-agent": "okhttp/4.12.0",
      }),
    ).toEqual({
      clientId: "loyaltyhive-app",
      appVersion: "1.1.8",
      appBuild: "11",
      appPlatform: "android",
      requestId: "req-123",
      osVersion: "Android 14",
      userAgent: "okhttp/4.12.0",
    });
  });

  it("trims whitespace and omits empty values", () => {
    expect(
      parseClientRequestMetadata({
        "x-client-id": "  loyaltyhive-app  ",
        "x-app-version": "",
        "x-app-build": "   ",
      }),
    ).toEqual({
      clientId: "loyaltyhive-app",
      appVersion: undefined,
      appBuild: undefined,
      appPlatform: undefined,
      userAgent: undefined,
    });
  });
});
