import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { AnalyticsEvents } from "@/lib/analytics/analytics-events";
import {
  clearBufferedAnalyticsEvents,
  getAnalyticsIdentityMode,
  resetAnalyticsIdentityForTests,
} from "@/lib/analytics/analytics-state";
import { ANALYTICS_USER_ID_STORAGE_KEY } from "@/lib/analytics/analytics-user";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { postApiV1AuthForgotPasswordMock } from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../../test/mocks/expo-secure-store";
import {
  isInitializedMock,
  trackCustomEventMock,
} from "../../test/mocks/expo-umami";
import { changeText, press, renderWithProviders } from "../../test/render";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

const expoRouterMocks = getExpoRouterMocks();

describe("[Integration] ForgotPasswordScreen", () => {
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
    expoRouterMocks.replace.mockClear();
    postApiV1AuthForgotPasswordMock.mockClear();
    trackCustomEventMock.mockClear();
  });

  it("asks for an email before sending", async () => {
    const { getByText } = await renderWithProviders(<ForgotPasswordScreen />);

    await press(getByText("Send reset link"));

    await waitFor(() => {
      expect(getByText("Enter your email.")).toBeTruthy();
    });
    expect(postApiV1AuthForgotPasswordMock).not.toHaveBeenCalled();
  });

  it("sends the request and shows the neutral confirmation", async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ForgotPasswordScreen />,
    );

    await changeText(getByPlaceholderText("Email"), " user@example.com ");
    await press(getByText("Send reset link"));

    await waitFor(() => {
      expect(postApiV1AuthForgotPasswordMock).toHaveBeenCalledTimes(1);
      expect(
        getByText(
          "If an account exists for this email, we sent password reset instructions.",
        ),
      ).toBeTruthy();
    });
    const [options] = postApiV1AuthForgotPasswordMock.mock.calls[0] as [
      { body: { email: string } },
    ];
    expect(options.body).toEqual({ email: "user@example.com" });
  });

  it("shows the API error when the request fails", async () => {
    postApiV1AuthForgotPasswordMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Too many requests" },
        response: { status: 429 },
      } as never),
    );
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ForgotPasswordScreen />,
    );

    await changeText(getByPlaceholderText("Email"), "user@example.com");
    await waitFor(() => {
      expect(getAnalyticsIdentityMode()).toBe("identified");
    });
    await press(getByText("Send reset link"));

    await waitFor(() => {
      expect(getByText("Too many requests")).toBeTruthy();
    });
    await waitFor(() => {
      expect(trackCustomEventMock).toHaveBeenCalledWith(
        `/events/${AnalyticsEvents.AUTH_PASSWORD_RESET_REQUEST_FAILED}`,
        AnalyticsEvents.AUTH_PASSWORD_RESET_REQUEST_FAILED,
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

  it("goes back to sign in", async () => {
    const { getByTestId } = await renderWithProviders(<ForgotPasswordScreen />);

    await press(getByTestId("back-to-sign-in"));

    expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
  });
});
