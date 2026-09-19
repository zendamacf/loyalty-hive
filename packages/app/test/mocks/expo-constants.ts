import { mock } from "bun:test";

mock.module("expo-constants", () => ({
  default: {
    expoConfig: {
      version: "1.1.8",
      ios: { buildNumber: "11" },
      android: { versionCode: 11 },
    },
    nativeAppVersion: "1.1.8",
    nativeBuildVersion: "11",
  },
}));
