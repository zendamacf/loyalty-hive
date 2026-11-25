import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { postApiV1AuthResetPasswordMock } from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  clearSecureStoreMock,
  setSecureStoreItem,
} from "../../test/mocks/expo-secure-store";
import { changeText, press, renderWithProviders } from "../../test/render";
import { ResetPasswordScreen } from "./ResetPasswordScreen";

const expoRouterMocks = getExpoRouterMocks();
const NEW_PASSWORD = "NewPassword456";

describe("[Integration] ResetPasswordScreen", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    setBearerToken(undefined);
    expoRouterMocks.params = { token: "reset-token" };
    expoRouterMocks.replace.mockClear();
    postApiV1AuthResetPasswordMock.mockClear();
  });

  it("shows an error when the link has no token", async () => {
    expoRouterMocks.params = {};
    const { getByText } = await renderWithProviders(<ResetPasswordScreen />);

    await waitFor(() => {
      expect(getByText("This link is missing a reset token.")).toBeTruthy();
    });
    await press(getByText("Request a new link"));
    expect(expoRouterMocks.replace).toHaveBeenCalledWith(
      Routes.FORGOT_PASSWORD,
    );
  });

  it("blocks a password that fails the policy", async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ResetPasswordScreen />,
    );

    await changeText(getByPlaceholderText("New password"), "short");
    await press(getByText("Reset password"));

    await waitFor(() => {
      expect(
        getByText("Password must be at least 12 characters."),
      ).toBeTruthy();
    });
    expect(postApiV1AuthResetPasswordMock).not.toHaveBeenCalled();
  });

  it("resets the password, clears the local session and offers sign in", async () => {
    setSecureStoreItem(AUTH_TOKEN_STORAGE_KEY, "stored-token");
    setBearerToken("stored-token");
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ResetPasswordScreen />,
    );

    await changeText(getByPlaceholderText("New password"), NEW_PASSWORD);
    await press(getByText("Reset password"));

    await waitFor(() => {
      expect(
        getByText("Your password was reset. Sign in with your new password."),
      ).toBeTruthy();
    });
    const [options] = postApiV1AuthResetPasswordMock.mock.calls[0] as [
      { body: { token: string; password: string } },
    ];
    expect(options.body).toEqual({
      token: "reset-token",
      password: NEW_PASSWORD,
    });
    expect(getBearerToken()).toBeUndefined();

    await press(getByText("Sign in"));
    expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
  });

  it("shows the expired-link state when the API rejects the token", async () => {
    postApiV1AuthResetPasswordMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Invalid or expired password reset link" },
        response: { status: 400 },
      } as never),
    );
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ResetPasswordScreen />,
    );

    await changeText(getByPlaceholderText("New password"), NEW_PASSWORD);
    await press(getByText("Reset password"));

    await waitFor(() => {
      expect(getByText("Reset failed")).toBeTruthy();
      expect(
        getByText(
          "This reset link is invalid or has expired. Request a new one.",
        ),
      ).toBeTruthy();
    });
  });

  it("shows other API errors inline and keeps the form", async () => {
    postApiV1AuthResetPasswordMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Too many requests" },
        response: { status: 429 },
      } as never),
    );
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ResetPasswordScreen />,
    );

    await changeText(getByPlaceholderText("New password"), NEW_PASSWORD);
    await press(getByText("Reset password"));

    await waitFor(() => {
      expect(getByText("Too many requests")).toBeTruthy();
    });
    expect(getByText("Reset password")).toBeTruthy();
  });
});
