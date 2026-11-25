import { beforeEach, describe, expect, it } from "bun:test";

import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Routes } from "@/constants/routes.constants";
import { AnalyticsEvents } from "@/lib/analytics/analytics-events";
import {
  clearBufferedAnalyticsEvents,
  getAnalyticsIdentityMode,
  resetAnalyticsIdentityForTests,
} from "@/lib/analytics/analytics-state";
import { ANALYTICS_USER_ID_STORAGE_KEY } from "@/lib/analytics/analytics-user";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { deleteApiV1AuthMeMock } from "../../test/mocks/api-client";
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
import { SheetIds } from "./sheetIds";

const expoRouterMocks = getExpoRouterMocks();

async function openSheet() {
  const utils = await renderWithProviders(<View testID="sheet-host" />);
  await act(async () => {
    void SheetManager.show(SheetIds.DELETE_ACCOUNT);
  });
  await waitFor(() => {
    expect(utils.getByText("Delete your account?")).toBeTruthy();
  });
  return utils;
}

describe("[Integration] DeleteAccountSheet", () => {
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
    setBearerToken("stored-token");
    expoRouterMocks.replace.mockClear();
    deleteApiV1AuthMeMock.mockClear();
    trackCustomEventMock.mockClear();
  });

  it("explains that deletion is permanent and keeps the button off until a password is typed", async () => {
    const { getByText, getByLabelText, getByTestId } = await openSheet();

    expect(getByText(/removed for good and cannot be restored/)).toBeTruthy();
    expect(getByLabelText("Enter your password to confirm")).toBeTruthy();
    expect(getByLabelText("No, keep my account")).toBeTruthy();

    await press(getByTestId("confirm-delete-account"));
    expect(deleteApiV1AuthMeMock).not.toHaveBeenCalled();
  });

  it("deletes the account, clears the session and returns to login", async () => {
    const { getByLabelText, getByTestId } = await openSheet();
    await waitFor(() => {
      expect(getAnalyticsIdentityMode()).toBe("identified");
    });

    await changeText(
      getByLabelText("Enter your password to confirm"),
      "CorrectPassword123",
    );
    await press(getByTestId("confirm-delete-account"));

    await waitFor(() => {
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
    });
    const [options] = deleteApiV1AuthMeMock.mock.calls[0] as [
      { body: { password: string } },
    ];
    expect(options.body).toEqual({ password: "CorrectPassword123" });
    expect(getBearerToken()).toBeUndefined();
    await waitFor(() => {
      expect(trackCustomEventMock).toHaveBeenCalledWith(
        `/events/${AnalyticsEvents.AUTH_ACCOUNT_DELETE}`,
        AnalyticsEvents.AUTH_ACCOUNT_DELETE,
        { data: { app_version: expect.any(String) } },
      );
    });
  });

  it("shows the error and keeps the session when the password is wrong", async () => {
    deleteApiV1AuthMeMock.mockImplementationOnce(() =>
      Promise.reject({ error: "Incorrect password" }),
    );
    const { getByLabelText, getByTestId, getByText } = await openSheet();

    await changeText(
      getByLabelText("Enter your password to confirm"),
      "WrongPassword123",
    );
    await press(getByTestId("confirm-delete-account"));

    await waitFor(() => {
      expect(getByText("Incorrect password")).toBeTruthy();
    });
    expect(expoRouterMocks.replace).not.toHaveBeenCalled();
    expect(getBearerToken()).toBe("stored-token");
  });
});
