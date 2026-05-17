import { beforeEach, describe, expect, it } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Routes } from "@/constants/routes.constants";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/auth.constants";
import { setConfigMock } from "../../test/mocks/api-client";
import {
  clearSecureStoreMock,
  secureStoreDeleteMock,
} from "../../test/mocks/expo-secure-store";
import { renderWithTheme } from "../../test/render";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof import("bun:test").mock>;
    replace: ReturnType<typeof import("bun:test").mock>;
  };
};

const { SettingsScreen } = await import("./SettingsScreen");

describe("SettingsScreen", () => {
  beforeEach(() => {
    clearSecureStoreMock();
    __expoRouterMocks.back.mockClear();
    __expoRouterMocks.replace.mockClear();
    setConfigMock.mockClear();
    secureStoreDeleteMock.mockClear();
  });

  it("renders theme toggle, language picker, and sign out button", () => {
    const { getByText, getByLabelText } = renderWithTheme(<SettingsScreen />);

    expect(getByText("Settings")).toBeTruthy();
    expect(getByText("Theme")).toBeTruthy();
    expect(getByText("Language")).toBeTruthy();
    expect(getByText("English")).toBeTruthy();
    expect(getByText("Español")).toBeTruthy();
    expect(getByLabelText("Use dark theme")).toBeTruthy();
    expect(getByText("Sign out")).toBeTruthy();
  });

  it("toggles dark theme from the theme control", async () => {
    const { getByLabelText, getByText } = renderWithTheme(<SettingsScreen />);

    expect(getByLabelText("Use dark theme")).toBeTruthy();
    expect(getByText("sun")).toBeTruthy();

    fireEvent.press(getByLabelText("Use dark theme"));

    await waitFor(() => {
      expect(getByLabelText("Use light theme")).toBeTruthy();
      expect(getByText("moon")).toBeTruthy();
      expect(getByText("Dark")).toBeTruthy();
    });
  });

  it("navigates back when close button is pressed", () => {
    const { getByLabelText } = renderWithTheme(<SettingsScreen />);

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });

  it("signs out when sign out is pressed", async () => {
    const { getByText } = renderWithTheme(<SettingsScreen />);

    fireEvent.press(getByText("Sign out"));

    await waitFor(() => {
      expect(setConfigMock).toHaveBeenCalledWith({ auth: undefined });
      expect(secureStoreDeleteMock).toHaveBeenCalledWith(
        AUTH_TOKEN_STORAGE_KEY,
      );
      expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
    });
  });
});
