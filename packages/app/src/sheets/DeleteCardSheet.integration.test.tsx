import { describe, expect, it } from "bun:test";

import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

describe("[Integration] DeleteCardSheet", () => {
  it("shows confirmation copy and delete button when open", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.DELETE_CARD, {
        payload: { cardId: "00000000-0000-4000-8000-000000000001" },
      });
    });

    await waitFor(() => {
      expect(getByText("Delete card?")).toBeTruthy();
      expect(
        getByText(
          "This card will be removed from your wallet. This cannot be undone.",
        ),
      ).toBeTruthy();
      expect(getByLabelText("Yes, delete card")).toBeTruthy();
      expect(getByLabelText("No, keep card")).toBeTruthy();
    });
  });
});
