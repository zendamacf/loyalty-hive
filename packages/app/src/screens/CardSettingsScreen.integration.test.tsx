import { beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import { deleteApiV1CardsByIdMock } from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  getExpoClipboardMocks,
  getReactNativeAlertMocks,
} from "../../test/mocks/react-native-globals";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();
const expoClipboardMocks = getExpoClipboardMocks();
const reactNativeAlertMocks = getReactNativeAlertMocks();

const { CardSettingsScreen } = await import("./CardSettingsScreen");

describe("[Integration] CardSettingsScreen", () => {
  beforeEach(() => {
    expoRouterMocks.dismissTo.mockClear();
    expoClipboardMocks.setStringAsync.mockClear();
    reactNativeAlertMocks.alert.mockClear();
    deleteApiV1CardsByIdMock.mockClear();
    expoRouterMocks.params = {
      id: "00000000-0000-4000-8000-000000000001",
      cardNumber: "1234567890",
      brandName: "ASOS",
      label: "Work card",
      createdAt: "2020-06-15T12:00:00.000Z",
    };
  });

  it("shows brand title, label subtitle, card number, and created date", async () => {
    const { getByText } = await renderWithProviders(<CardSettingsScreen />);

    expect(getByText("ASOS")).toBeTruthy();
    expect(getByText("Work card")).toBeTruthy();
    expect(getByText("1234567890")).toBeTruthy();
    expect(getByText("June 15, 2020")).toBeTruthy();
  });

  it("uses label as title when brand is not set", async () => {
    expoRouterMocks.params = {
      id: "00000000-0000-4000-8000-0000000000c1",
      cardNumber: "333",
      brandName: "",
      label: "Gym membership",
      createdAt: "2020-01-01T00:00:00.000Z",
    };

    const { getByText, queryByText } = await renderWithProviders(
      <CardSettingsScreen />,
    );

    expect(getByText("Gym membership")).toBeTruthy();
    expect(queryByText("Card number")).toBeTruthy();
    expect(queryByText("Work card")).toBeNull();
  });

  it("copies card number when copy is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(
      <CardSettingsScreen />,
    );

    await press(getByLabelText("Copy card number"));

    expect(expoClipboardMocks.setStringAsync).toHaveBeenCalledWith(
      "1234567890",
    );
  });

  it("shows delete confirmation before deleting", async () => {
    const { getByLabelText } = await renderWithProviders(
      <CardSettingsScreen />,
    );

    await press(getByLabelText("Delete card"));

    expect(reactNativeAlertMocks.alert).toHaveBeenCalled();
    const buttons = reactNativeAlertMocks.alert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const confirm = buttons.find((button) => button.text === "Delete card");
    await act(async () => {
      confirm?.onPress?.();
    });

    await waitFor(() =>
      expect(deleteApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
        }),
      ),
    );
  });

  it("returns to cards after a successful delete", async () => {
    const { getByLabelText } = await renderWithProviders(
      <CardSettingsScreen />,
    );

    await press(getByLabelText("Delete card"));

    const buttons = reactNativeAlertMocks.alert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    await act(async () => {
      buttons.find((button) => button.text === "Delete card")?.onPress?.();
    });

    await waitFor(() =>
      expect(expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS),
    );
  });
});
