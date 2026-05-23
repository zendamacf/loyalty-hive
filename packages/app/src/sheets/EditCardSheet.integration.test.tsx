import { describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

describe("[Integration] EditCardSheet", () => {
  it("shows label, default view controls, and save when open", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      await SheetManager.show(SheetIds.EDIT_CARD, {
        payload: {
          label: "Work card",
          defaultView: "1D",
        },
      });
    });

    await waitFor(() => {
      expect(getByText("Edit card")).toBeTruthy();
      expect(getByLabelText("Card name").props.value).toBe("Work card");
      expect(getByText("Save")).toBeTruthy();
    });
  });
});
