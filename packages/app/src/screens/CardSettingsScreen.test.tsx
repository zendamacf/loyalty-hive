import { beforeEach, describe, expect, it, type mock } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { deleteApiV1CardsByIdMock } from "../../test/mocks/api-client";
import { renderWithTheme } from "../../test/render";

const { __expoRouterMocks, __expoClipboardMocks, __reactNativeAlertMocks } =
  globalThis as unknown as {
    __expoRouterMocks: {
      dismissTo: ReturnType<typeof mock>;
      params: Record<string, string | undefined>;
    };
    __expoClipboardMocks: {
      setStringAsync: ReturnType<typeof mock>;
    };
    __reactNativeAlertMocks: {
      alert: ReturnType<typeof mock>;
    };
  };

const { CardSettingsScreen } = await import("./CardSettingsScreen");

describe("CardSettingsScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.dismissTo.mockClear();
    __expoClipboardMocks.setStringAsync.mockClear();
    __reactNativeAlertMocks.alert.mockClear();
    deleteApiV1CardsByIdMock.mockClear();
    __expoRouterMocks.params = {
      id: "00000000-0000-4000-8000-000000000001",
      cardNumber: "1234567890",
      brandName: "ASOS",
      label: "Work card",
      createdAt: "2020-06-15T12:00:00.000Z",
    };
  });

  it("shows brand title, label subtitle, card number, and created date", async () => {
    const { getByText } = await renderWithTheme(<CardSettingsScreen />);

    expect(getByText("ASOS")).toBeTruthy();
    expect(getByText("Work card")).toBeTruthy();
    expect(getByText("1234567890")).toBeTruthy();
    expect(getByText("June 15, 2020")).toBeTruthy();
  });

  it("uses label as title when brand is not set", async () => {
    __expoRouterMocks.params = {
      id: "00000000-0000-4000-8000-0000000000c1",
      cardNumber: "333",
      brandName: "",
      label: "Gym membership",
      createdAt: "2020-01-01T00:00:00.000Z",
    };

    const { getByText, queryByText } = await renderWithTheme(
      <CardSettingsScreen />,
    );

    expect(getByText("Gym membership")).toBeTruthy();
    expect(queryByText("Card number")).toBeTruthy();
    expect(queryByText("Work card")).toBeNull();
  });

  it("copies card number when copy is pressed", async () => {
    const { getByLabelText } = await renderWithTheme(<CardSettingsScreen />);

    fireEvent.press(getByLabelText("Copy card number"));

    expect(__expoClipboardMocks.setStringAsync).toHaveBeenCalledWith(
      "1234567890",
    );
  });

  it("shows delete confirmation before deleting", async () => {
    const { getByLabelText } = await renderWithTheme(<CardSettingsScreen />);

    fireEvent.press(getByLabelText("Delete card"));

    expect(__reactNativeAlertMocks.alert).toHaveBeenCalled();
    const buttons = __reactNativeAlertMocks.alert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const confirm = buttons.find((button) => button.text === "Delete card");
    confirm?.onPress?.();

    await waitFor(() =>
      expect(deleteApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
        }),
      ),
    );
  });

  it("returns to cards after a successful delete", async () => {
    const { getByLabelText } = await renderWithTheme(<CardSettingsScreen />);

    fireEvent.press(getByLabelText("Delete card"));

    const buttons = __reactNativeAlertMocks.alert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    buttons.find((button) => button.text === "Delete card")?.onPress?.();

    await waitFor(() =>
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS),
    );
  });
});
