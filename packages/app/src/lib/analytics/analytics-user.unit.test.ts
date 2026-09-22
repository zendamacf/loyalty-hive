import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import {
  clearSecureStoreMock,
  secureStoreDeleteMock,
  secureStoreSetMock,
} from "../../../test/mocks/expo-secure-store";
import {
  clearUserMock,
  identifyUserMock,
  initUmamiMock,
  isInitializedMock,
} from "../../../test/mocks/expo-umami";
import {
  sentryLoggerErrorMock,
  sentryLoggerInfoMock,
} from "../../../test/mocks/sentry";
import {
  ANALYTICS_USER_ID_STORAGE_KEY,
  clearAnalyticsUser,
  clearAnalyticsUserId,
  loadAnalyticsUserId,
  persistAnalyticsUserId,
  setupUmami,
  syncAnalyticsUser,
} from "./analytics-user";

describe("[Unit] analytics user", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    secureStoreSetMock.mockClear();
    secureStoreDeleteMock.mockClear();
    identifyUserMock.mockClear();
    clearUserMock.mockClear();
    initUmamiMock.mockClear();
    isInitializedMock.mockReturnValue(true);
    sentryLoggerInfoMock.mockClear();
    sentryLoggerErrorMock.mockClear();
  });

  describe("user id storage", () => {
    it("persists and loads the analytics user id", async () => {
      await persistAnalyticsUserId("00000000-0000-4000-8000-000000000001");

      expect(secureStoreSetMock).toHaveBeenCalledWith(
        ANALYTICS_USER_ID_STORAGE_KEY,
        "00000000-0000-4000-8000-000000000001",
      );
      await expect(loadAnalyticsUserId()).resolves.toBe(
        "00000000-0000-4000-8000-000000000001",
      );
    });

    it("clears the stored analytics user id", async () => {
      await persistAnalyticsUserId("00000000-0000-4000-8000-000000000001");

      await clearAnalyticsUserId();

      expect(secureStoreDeleteMock).toHaveBeenCalledWith(
        ANALYTICS_USER_ID_STORAGE_KEY,
      );
      await expect(loadAnalyticsUserId()).resolves.toBeNull();
    });
  });

  describe("syncAnalyticsUser", () => {
    it("identifies the analytics user", async () => {
      await syncAnalyticsUser("00000000-0000-4000-8000-000000000001");

      expect(identifyUserMock).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000001",
      );
    });

    it("no-ops when Umami is not initialized", () => {
      isInitializedMock.mockReturnValue(false);

      syncAnalyticsUser("00000000-0000-4000-8000-000000000001");

      expect(identifyUserMock).not.toHaveBeenCalled();
    });
  });

  describe("clearAnalyticsUser", () => {
    it("clears the analytics user identity", () => {
      clearAnalyticsUser();

      expect(clearUserMock).toHaveBeenCalledTimes(1);
    });

    it("no-ops when Umami is not initialized", () => {
      isInitializedMock.mockReturnValue(false);
      clearAnalyticsUser();

      expect(clearUserMock).not.toHaveBeenCalled();
    });
  });

  describe("setupUmami", () => {
    const originalHost = process.env.EXPO_PUBLIC_UMAMI_HOST;
    const originalWebsiteId = process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID;

    afterEach(() => {
      process.env.EXPO_PUBLIC_UMAMI_HOST = originalHost;
      process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID = originalWebsiteId;
    });

    it("initializes Umami when host and website id are configured", async () => {
      process.env.EXPO_PUBLIC_UMAMI_HOST = "https://analytics.example.com";
      process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID = "website-id";

      await setupUmami();

      expect(initUmamiMock).toHaveBeenCalledWith({
        hostUrl: "https://analytics.example.com",
        websiteId: "website-id",
        disabled: __DEV__,
      });
      expect(sentryLoggerInfoMock).toHaveBeenCalled();
      expect(sentryLoggerErrorMock).not.toHaveBeenCalled();
    });

    it("skips initialization when configuration is incomplete", async () => {
      process.env.EXPO_PUBLIC_UMAMI_HOST = "";
      process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID = "";

      await setupUmami();

      expect(initUmamiMock).not.toHaveBeenCalled();
      expect(sentryLoggerErrorMock).toHaveBeenCalled();
    });
  });
});
