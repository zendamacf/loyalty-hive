import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { postApiV1SharesMock } from "../../test/mocks/api-client";
import { changeText, press, renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

const CARD_ID = "00000000-0000-4000-8000-000000000001";
const defaultShare = postApiV1SharesMock.getMockImplementation();

async function openSheet() {
  const result = await renderWithProviders(<View testID="sheet-host" />);
  await act(async () => {
    void SheetManager.show(SheetIds.SHARE_CARD, {
      payload: { cardId: CARD_ID },
    });
  });
  await result.findByLabelText("Their email");
  return result;
}

describe("[Integration] ShareCardSheet", () => {
  beforeEach(() => {
    postApiV1SharesMock.mockClear();
  });

  afterEach(() => {
    if (defaultShare) postApiV1SharesMock.mockImplementation(defaultShare);
  });

  it("sends a card invite and shows the same message for every email", async () => {
    const { getByLabelText, getByText, findByText } = await openSheet();

    await changeText(getByLabelText("Their email"), " friend@example.com ");
    await press(getByText("Send invite"));

    await waitFor(() => {
      expect(postApiV1SharesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { scope: "card", cardId: CARD_ID, email: "friend@example.com" },
        }),
      );
    });
    expect(
      await findByText(
        "If there is a LoyaltyHive account with this email, we sent them an invite. The link expires in 7 days.",
      ),
    ).toBeTruthy();
  });

  it("shares all cards when there is no card id", async () => {
    const result = await renderWithProviders(<View testID="sheet-host" />);
    await act(async () => {
      void SheetManager.show(SheetIds.SHARE_CARD, { payload: {} });
    });
    await changeText(
      await result.findByLabelText("Their email"),
      "friend@example.com",
    );
    await press(result.getByText("Send invite"));

    await waitFor(() => {
      expect(postApiV1SharesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { scope: "account", email: "friend@example.com" },
        }),
      );
    });
  });

  it("shows the API error, for example a limit", async () => {
    postApiV1SharesMock.mockImplementation(() =>
      Promise.reject({ error: "Too many invites today" }),
    );
    const { getByLabelText, getByText, findByText } = await openSheet();

    await changeText(getByLabelText("Their email"), "friend@example.com");
    await press(getByText("Send invite"));

    expect(await findByText("Too many invites today")).toBeTruthy();
  });
});
