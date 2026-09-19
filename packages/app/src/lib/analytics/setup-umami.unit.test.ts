import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { initUmamiMock } from "../../../test/mocks/expo-umami";
import {
  sentryLoggerErrorMock,
  sentryLoggerInfoMock,
} from "../../../test/mocks/sentry";
import { setupUmami } from "./setup-umami";

describe("setupUmami", () => {
  const originalHost = process.env.EXPO_PUBLIC_UMAMI_HOST;
  const originalWebsiteId = process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID;

  beforeEach(() => {
    initUmamiMock.mockClear();
    sentryLoggerInfoMock.mockClear();
    sentryLoggerErrorMock.mockClear();
  });

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
