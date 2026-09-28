import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";

import { AnalyticsEvents } from "@/lib/analytics/analytics-events";
import {
  clearBufferedAnalyticsEvents,
  getAnalyticsIdentityMode,
  resetAnalyticsIdentityForTests,
} from "@/lib/analytics/analytics-state";
import { ANALYTICS_USER_ID_STORAGE_KEY } from "@/lib/analytics/analytics-user";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import {
  getApiV1AuthMeMock,
  postApiV1AuthResendVerificationMock,
} from "../../test/mocks/api-client";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../../test/mocks/expo-secure-store";
import {
  isInitializedMock,
  trackCustomEventMock,
} from "../../test/mocks/expo-umami";
import { press, renderWithProviders } from "../../test/render";
import { CheckEmailScreen } from "./CheckEmailScreen";

async function waitForIdentifiedAnalytics(): Promise<void> {
  await waitFor(() => {
    expect(getAnalyticsIdentityMode()).toBe("identified");
  });
}

describe("[Integration] CheckEmailScreen", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    resetAnalyticsIdentityForTests();
    clearBufferedAnalyticsEvents();
    isInitializedMock.mockReturnValue(true);
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
    setSecureStoreItem(
      ANALYTICS_USER_ID_STORAGE_KEY,
      "00000000-0000-4000-8000-000000000001",
    );
    postApiV1AuthResendVerificationMock.mockClear();
    trackCustomEventMock.mockClear();
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "user@example.com",
          emailVerified: false,
        },
        error: undefined,
      }),
    );
  });

  it("shows check-email copy and resends verification", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);

    await waitFor(() => {
      expect(getByText("Check your email")).toBeTruthy();
      expect(getByText(/user@example.com/)).toBeTruthy();
    });
    await waitForIdentifiedAnalytics();

    await press(getByText("Resend email"));

    await waitFor(() => {
      expect(postApiV1AuthResendVerificationMock).toHaveBeenCalled();
      expect(trackCustomEventMock).toHaveBeenCalledWith(
        `/events/${AnalyticsEvents.AUTH_EMAIL_RESEND}`,
        AnalyticsEvents.AUTH_EMAIL_RESEND,
        {
          data: {
            app_version: expect.any(String),
          },
        },
      );
    });
  });
});
