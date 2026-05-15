import { mock } from "bun:test";

mock.module("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
