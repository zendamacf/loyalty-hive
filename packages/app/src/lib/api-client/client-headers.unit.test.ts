import { afterEach, describe, expect, it } from "bun:test";
import { Platform } from "react-native";

import { clientHeaders, osVersionHeader } from "./client-headers";

const defaultPlatform = {
  OS: "ios" as const,
  Version: "17.0",
  constants: {
    systemName: "iOS",
    osVersion: "17.0",
  },
};

describe("[Unit] client-headers", () => {
  afterEach(() => {
    Object.assign(Platform, defaultPlatform);
  });

  it("returns client identification headers", () => {
    expect(clientHeaders()).toEqual({
      "x-client-id": "loyaltyhive-app",
      "x-app-version": "1.1.8",
      "x-app-build": "11",
      "x-app-platform": "ios",
      "x-os-version": "iOS 17.0",
    });
  });

  it("formats android os version from platform constants", () => {
    Object.assign(Platform, {
      OS: "android",
      Version: 34,
      constants: { Release: "14" },
    });

    expect(osVersionHeader()).toBe("Android 14");
  });
});
