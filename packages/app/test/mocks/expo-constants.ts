import { mock } from "bun:test";

mock.module("expo-constants", () => ({
  ExecutionEnvironment: {
    Bare: "bare",
    Standalone: "standalone",
    StoreClient: "storeClient",
  },
  default: {
    executionEnvironment: "bare",
    expoConfig: {
      slug: "loyaltyhive",
      version: "1.1.8",
      ios: { buildNumber: "11" },
      android: { versionCode: 11 },
    },
    nativeAppVersion: "1.1.8",
    nativeBuildVersion: "11",
  },
}));
