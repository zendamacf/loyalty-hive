import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import i18n from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";
import { getBearerToken, setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { THEME_STORAGE_KEY } from "@/theme/theme.constants";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  clearSecureStoreMock,
  secureStoreDeleteMock,
} from "../../test/mocks/expo-secure-store";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();

const { SettingsScreen } = await import("./SettingsScreen");

describe("[Integration] SettingsScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    clearSecureStoreMock();
    setBearerToken(undefined);
    expoRouterMocks.back.mockClear();
    expoRouterMocks.replace.mockClear();
    secureStoreDeleteMock.mockClear();
  });

  it("renders theme picker, language picker, and sign out button", async () => {
    const { getByText, getByLabelText } = await renderWithProviders(
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
    const { getByLabelText, getByTestId, getByText } =
      await renderWithProviders(<SettingsScreen />);

    expect(getByText("System")).toBeTruthy();

    await press(getByLabelText("Theme"));

    await waitFor(() => {
      expect(getByTestId("dark-theme-swatch")).toBeTruthy();
    });

    await press(getByText("Dark"));
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(<SettingsScreen />);

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalled();
  });

  it("signs out when sign out is pressed", async () => {
    const { getByText } = await renderWithProviders(<SettingsScreen />);

    await press(getByText("Sign out"));

    await waitFor(() => {
      expect(getBearerToken()).toBeUndefined();
      expect(secureStoreDeleteMock).toHaveBeenCalledWith(
        AUTH_TOKEN_STORAGE_KEY,
      );
      expect(expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
    });
  });

  it("switches to Spanish and persists language preference", async () => {
    const { getByText, getByLabelText } = await renderWithProviders(
      <SettingsScreen />,
    );

    await press(getByLabelText("Language"));
    await press(getByText("Español"));

    await waitFor(() => {
      expect(getByText("Ajustes")).toBeTruthy();
      expect(getByText("Idioma")).toBeTruthy();
      expect(getByText("Cerrar sesión")).toBeTruthy();
    });

    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
  });
});

describe("[Integration] SettingsScreen i18n", () => {
  afterEach(async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders Spanish copy when locale is es", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "es");

    const { findByText } = await renderWithProviders(<SettingsScreen />);

    expect(await findByText("Ajustes")).toBeTruthy();
    expect(await findByText("Tema")).toBeTruthy();
  });
});
