import { beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import {
  createCardMock,
  patchApiV1CardsByIdMock,
} from "../../test/mocks/api-client";
import { press, renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

describe("[Integration] EditCardSheet", () => {
  beforeEach(async () => {
    await SheetManager.hide(SheetIds.EDIT_CARD);
  });

  it("shows label, default view controls, and save when open", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.EDIT_CARD, {
        payload: {
          cardId: "00000000-0000-4000-8000-000000000001",
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

  it("patches the card and closes with updated values when save is pressed", async () => {
    patchApiV1CardsByIdMock.mockImplementationOnce(async () => ({
      data: createCardMock({ label: "Updated label", view: "2D" }),
      error: undefined,
    }));

    const { getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    let saveResult: Promise<{ label: string; view: string } | undefined> =
      Promise.resolve(undefined);

    await act(async () => {
      saveResult = SheetManager.show(SheetIds.EDIT_CARD, {
        payload: {
          cardId: "00000000-0000-4000-8000-000000000001",
          label: "Work card",
          defaultView: "1D",
        },
      });
    });

    await waitFor(() => {
      expect(getByText("Save")).toBeTruthy();
    });

    await press(getByText("Save"), { flushLayout: false });

    await waitFor(() => {
      expect(patchApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
          body: { label: "Work card", view: "1D" },
        }),
      );
    });

    await expect(saveResult).resolves.toEqual({
      label: "Updated label",
      view: "2D",
    });
  });
});
