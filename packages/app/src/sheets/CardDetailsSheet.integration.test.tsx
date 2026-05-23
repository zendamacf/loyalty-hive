import { describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { getExpoClipboardMocks } from "../../test/mocks/react-native-globals";
import { press, renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

const expoClipboardMocks = getExpoClipboardMocks();

describe("[Integration] CardDetailsSheet", () => {
  it("shows the card number and copies it when copy is pressed", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.CARD_DETAILS, {
        payload: {
          cardNumber: "1234567890",
          createdAt: "2020-06-15T12:00:00.000Z",
        },
      });
    });

    await waitFor(() => {
      expect(getByText("1234567890")).toBeTruthy();
      expect(getByText("June 15, 2020")).toBeTruthy();
    });

    await press(getByLabelText("Copy card number"));

    expect(expoClipboardMocks.setStringAsync).toHaveBeenCalledWith(
      "1234567890",
    );
  });
});
