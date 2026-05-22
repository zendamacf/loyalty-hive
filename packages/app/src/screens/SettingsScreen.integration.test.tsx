import { beforeEach, describe, expect, it } from "bun:test";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { THEME_STORAGE_KEY } from "@/theme/theme.constants";
import {
  clearSecureStoreMock,
  secureStoreDeleteMock,
} from "../../test/mocks/expo-secure-store";
import { press, renderWithTheme } from "../../test/render";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof import("bun:test").mock>;
    replace: ReturnType<typeof import("bun:test").mock>;
  };
};

const { SettingsScreen } = await import("./SettingsScreen");

describe("[Integration] SettingsScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    clearSecureStoreMock();
    setBearerToken(undefined);
    __expoRouterMocks.back.mockClear();
    __expoRouterMocks.replace.mockClear();
    secureStoreDeleteMock.mockClear();
  });

  it("renders theme picker, language picker, and sign out button", async () => {
    const { getByText, getByLabelText } = await renderWithTheme(
      <SettingsScreen />,
    );

    expect(getByText("Settings")).toBeTruthy();
    expect(getByText("Theme")).toBeTruthy();
    expect(getByText("Language")).toBeTruthy();
    expect(getByText("English")).toBeTruthy();
    expect(getByText("System")).toBeTruthy();
    expect(getByText("Sign out")).toBeTruthy();

    await press(getByLabelText("Language"));

    await waitFor(() => {
      expect(getByText("Español")).toBeTruthy();
    });
  });

  it("changes theme from the theme picker", async () => {
    const { getByLabelText, getByTestId, getByText } = await renderWithTheme(
      <SettingsScreen />,
    );

    expect(getByText("System")).toBeTruthy();

    await press(getByLabelText("Theme"));

    await waitFor(() => {
      expect(getByTestId("dark-theme-swatch")).toBeTruthy();
    });

    await press(getByText("Dark"));
  });
});

it("navigates back when close button is pressed", async () => {
  const { getByLabelText } = await renderWithTheme(<SettingsScreen />);

  fireEvent.press(getByLabelText("Close"));

  expect(__expoRouterMocks.back).toHaveBeenCalled();
});

it("signs out when sign out is pressed", async () => {
  const { getByText } = await renderWithTheme(<SettingsScreen />);

  fireEvent.press(getByText("Sign out"));

  await waitFor(() => {
    expect(getBearerToken()).toBeUndefined();
    expect(secureStoreDeleteMock).toHaveBeenCalledWith(AUTH_TOKEN_STORAGE_KEY);
    expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
  });
});
