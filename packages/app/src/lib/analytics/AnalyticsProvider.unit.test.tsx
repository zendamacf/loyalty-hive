import { beforeEach, describe, expect, it } from "bun:test";

import { render, waitFor } from "@testing-library/react-native";

import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { getApiV1AuthMeMock } from "../../../test/mocks/api-client";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../../../test/mocks/expo-secure-store";
import {
  flushMock,
  identifyUserMock,
  initUmamiMock,
  isInitializedMock,
  trackCustomEventMock,
} from "../../../test/mocks/expo-umami";
import { emitAppStateChange } from "../../../test/mocks/react-native-app-state";
import { AnalyticsEvents } from "./analytics-events";
import {
  clearBufferedAnalyticsEvents,
  getAnalyticsIdentityMode,
  resetAnalyticsIdentityForTests,
} from "./analytics-state";
import { ANALYTICS_USER_ID_STORAGE_KEY } from "./analytics-user";
import { trackAppEvent } from "./track-app-event";

const { AnalyticsProvider } = await import("./AnalyticsProvider");
const { AuthProvider } = await import("@/lib/auth");

function renderAnalyticsProviders(): void {
  render(
    <AuthProvider>
      <AnalyticsProvider>{null}</AnalyticsProvider>
    </AuthProvider>,
  );
}

describe("[Unit] AnalyticsProvider", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    resetAnalyticsIdentityForTests();
    initUmamiMock.mockClear();
    identifyUserMock.mockClear();
    flushMock.mockClear();
    trackCustomEventMock.mockClear();
    clearBufferedAnalyticsEvents();
    isInitializedMock.mockReturnValue(true);
    getApiV1AuthMeMock.mockClear();
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: { id: "00000000-0000-4000-8000-000000000001" },
        error: undefined,
      }),
    );
    process.env.EXPO_PUBLIC_UMAMI_HOST = "https://analytics.example.com";
    process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID = "website-id";
  });

  it("identifies from persisted user id before auth is ready", async () => {
    setSecureStoreItem(
      ANALYTICS_USER_ID_STORAGE_KEY,
      "00000000-0000-4000-8000-000000000099",
    );

    renderAnalyticsProviders();

    await waitFor(() => {
      expect(identifyUserMock).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000099",
      );
      expect(getAnalyticsIdentityMode()).toBe("identified");
    });
  });

  it("defers tracking on the login page until the user is identified", async () => {
    renderAnalyticsProviders();

    await waitFor(() => {
      expect(getAnalyticsIdentityMode()).toBe("deferred");
    });

    await trackAppEvent(AnalyticsEvents.AUTH_SIGNUP);

    expect(trackCustomEventMock).not.toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });

  it("flushes deferred login events when the app backgrounds without a login", async () => {
    renderAnalyticsProviders();

    await waitFor(() => {
      expect(getAnalyticsIdentityMode()).toBe("deferred");
    });

    await trackAppEvent(AnalyticsEvents.AUTH_SIGNUP);

    emitAppStateChange("background");

    await waitFor(() => {
      expect(trackCustomEventMock).toHaveBeenCalledWith(
        "/events/auth_signup",
        "auth_signup",
        undefined,
      );
      expect(flushMock).toHaveBeenCalledTimes(1);
    });

    expect(identifyUserMock).not.toHaveBeenCalled();
  });

  it("identifies and persists after /auth/me resolves on session restore", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-jwt");

    renderAnalyticsProviders();

    await waitFor(() => {
      expect(identifyUserMock).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000001",
      );
      expect(getAnalyticsIdentityMode()).toBe("identified");
    });
  });
});
