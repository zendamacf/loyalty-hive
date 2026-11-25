import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import { Routes } from "@/constants/routes.constants";
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
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
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

const expoRouterMocks = getExpoRouterMocks();

describe("[Integration] CheckEmailScreen", () => {
  beforeEach(() => {
    expoRouterMocks.params = {};
    expoRouterMocks.replace.mockClear();
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

  it("shows the API error and tracks a failed resend", async () => {
    postApiV1AuthResendVerificationMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Too many requests" },
        response: { status: 429 },
      } as never),
    );
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);
    await waitFor(() => {
      expect(getByText(/user@example.com/)).toBeTruthy();
    });
    await waitForIdentifiedAnalytics();

    await press(getByText("Resend email"));

    await waitFor(() => {
      expect(getByText("Too many requests")).toBeTruthy();
      expect(trackCustomEventMock).toHaveBeenCalledWith(
        `/events/${AnalyticsEvents.AUTH_EMAIL_RESEND_FAILED}`,
        AnalyticsEvents.AUTH_EMAIL_RESEND_FAILED,
        {
          data: {
            app_version: expect.any(String),
            reason: "api_error",
            status_code: 429,
          },
        },
      );
    });
  });

  it("shows success copy after resend", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);
    await waitFor(() => {
      expect(getByText(/user@example.com/)).toBeTruthy();
    });

    await press(getByText("Resend email"));

    await waitFor(() => {
      expect(
        getByText("If your account needs verification, we sent another email."),
      ).toBeTruthy();
    });
  });

  it("uses the email from route params", async () => {
    expoRouterMocks.params = { email: "route@example.com" };
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);

    await waitFor(() => {
      expect(getByText(/route@example.com/)).toBeTruthy();
    });
  });

  it("opens the mail app", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);
    await waitFor(() => {
      expect(getByText("Open mail app")).toBeTruthy();
    });

    await press(getByText("Open mail app"));

    expect(Linking.openURL).toHaveBeenCalledWith("mailto:");
  });

  it("tells the user when the email is still unverified", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);
    await waitFor(() => {
      expect(getByText(/user@example.com/)).toBeTruthy();
    });

    await press(getByText("I've verified my email"));

    await waitFor(() => {
      expect(
        getByText(
          "Your email is not verified yet. Try again after opening the link.",
        ),
      ).toBeTruthy();
    });
    expect(expoRouterMocks.replace).not.toHaveBeenCalled();
  });

  it("goes to cards once the email is verified", async () => {
    const { getByText } = await renderWithProviders(<CheckEmailScreen />);
    await waitFor(() => {
      expect(getByText(/user@example.com/)).toBeTruthy();
    });
    getApiV1AuthMeMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "user@example.com",
          emailVerified: true,
        },
        error: undefined,
      }),
    );

    await press(getByText("I've verified my email"));

    await waitFor(() => {
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.CARDS);
    });
  });
});
