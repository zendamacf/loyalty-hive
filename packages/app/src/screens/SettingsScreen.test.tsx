import { beforeEach, describe, expect, it } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Routes } from "@/constants/routes.constants";
import { setConfigMock } from "../../test/mocks/api-client";
import { renderWithTheme } from "../../test/render";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    replace: ReturnType<typeof import("bun:test").mock>;
  };
};

const { SettingsScreen } = await import("./SettingsScreen");

describe("SettingsScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.replace.mockClear();
    setConfigMock.mockClear();
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

  it("signs out when sign out is pressed", () => {
    const { getByText } = renderWithTheme(<SettingsScreen />);

    fireEvent.press(getByText("Sign out"));

    expect(setConfigMock).toHaveBeenCalledWith({ auth: undefined });
    expect(__expoRouterMocks.replace).toHaveBeenCalledWith(Routes.LOGIN);
  });
});
