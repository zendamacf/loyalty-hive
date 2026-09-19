import { beforeEach, describe, expect, it, mock } from "bun:test";

const expoConfig = {
  version: "1.1.8",
  ios: { buildNumber: "11" },
  android: { versionCode: 11 },
};

mock.module("expo-constants", () => ({
  default: {
    expoConfig,
    nativeAppVersion: "1.1.8",
    nativeBuildVersion: "11",
  },
}));

mock.module("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

const { clientHeaders } = await import("./client-headers");

describe("[Unit] client-headers", () => {
  beforeEach(() => {
    expoConfig.version = "1.1.8";
    expoConfig.ios.buildNumber = "11";
    expoConfig.android.versionCode = 11;
  });

  it("returns client identification headers", () => {
    expect(clientHeaders()).toEqual({
      "x-client-id": "loyaltyhive-app",
      "x-app-version": "1.1.8",
      "x-app-build": "11",
      "x-app-platform": "ios",
    });
  });
});
