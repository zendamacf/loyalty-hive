import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";

import { defaultCardsResponse } from "../../test/fixtures/cards";
import {
  deleteApiV1SharesByIdMock,
  deleteApiV1SharesInvitesByIdMock,
  getApiV1CardsMock,
  getApiV1SharesIncomingMock,
  getApiV1SharesOutgoingMock,
} from "../../test/mocks/api-client";
import { getReactNativeAlertMocks } from "../../test/mocks/react-native-globals";
import { press, renderWithProviders } from "../../test/render";
import { SharingScreen } from "./SharingScreen";

const CARD_ID = "00000000-0000-4000-8000-000000000001";
const alertMock = getReactNativeAlertMocks().alert;
const defaults = {
  outgoing: getApiV1SharesOutgoingMock.getMockImplementation(),
  incoming: getApiV1SharesIncomingMock.getMockImplementation(),
  cards: getApiV1CardsMock.getMockImplementation(),
};

const share = (id: string, email: string, cardId: string | null) => ({
  id,
  scope: cardId ? ("card" as const) : ("account" as const),
  cardId,
  email,
  createdAt: "2026-11-01T00:00:00.000Z",
});

/** Presses the destructive button of the last confirm alert. */
async function confirmLastAlert() {
  const buttons = alertMock.mock.calls.at(-1)?.[2] as Array<{
    style?: string;
    onPress?: () => void;
  }>;
  await act(async () => {
    buttons.find((b) => b.style === "destructive")?.onPress?.();
  });
}

describe("[Integration] SharingScreen", () => {
  beforeEach(() => {
    alertMock.mockClear();
    deleteApiV1SharesByIdMock.mockClear();
    deleteApiV1SharesInvitesByIdMock.mockClear();
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve(defaultCardsResponse),
    );
    getApiV1SharesOutgoingMock.mockImplementation(() =>
      Promise.resolve({
        data: {
          shares: [share("s1", "friend@example.com", CARD_ID)],
          invites: [
            {
              ...share("i1", "nobody@example.com", null),
              expiresAt: "2026-12-01T00:00:00.000Z",
            },
          ],
        },
      }),
    );
    getApiV1SharesIncomingMock.mockImplementation(() =>
      Promise.resolve({ data: [share("s2", "owner@example.com", null)] }),
    );
  });

  afterEach(() => {
    if (defaults.outgoing)
      getApiV1SharesOutgoingMock.mockImplementation(defaults.outgoing);
    if (defaults.incoming)
      getApiV1SharesIncomingMock.mockImplementation(defaults.incoming);
    if (defaults.cards) getApiV1CardsMock.mockImplementation(defaults.cards);
  });

  it("lists shares by you, pending invites, and shares with you", async () => {
    const { findByText, getByText } = await renderWithProviders(
      <SharingScreen />,
    );

    expect(await findByText("friend@example.com")).toBeTruthy();
    expect(getByText("ASOS")).toBeTruthy();
    expect(getByText("nobody@example.com")).toBeTruthy();
    expect(getByText("All cards · Invite pending")).toBeTruthy();
    expect(getByText("owner@example.com")).toBeTruthy();
  });

  it("shows empty text when nothing is shared", async () => {
    getApiV1SharesOutgoingMock.mockImplementation(() =>
      Promise.resolve({ data: { shares: [], invites: [] } }),
    );
    getApiV1SharesIncomingMock.mockImplementation(() =>
      Promise.resolve({ data: [] }),
    );
    const { findByText } = await renderWithProviders(<SharingScreen />);

    expect(await findByText("You have not shared any cards.")).toBeTruthy();
    expect(await findByText("No one has shared cards with you.")).toBeTruthy();
  });

  it("stops a share, cancels an invite, and leaves a share after confirm", async () => {
    const { findByLabelText, getByLabelText } = await renderWithProviders(
      <SharingScreen />,
    );

    await press(await findByLabelText("Stop sharing, friend@example.com"));
    expect(alertMock.mock.calls.at(-1)?.[0]).toBe("Stop sharing?");
    await confirmLastAlert();
    await waitFor(() => {
      expect(deleteApiV1SharesByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "s1" } }),
      );
    });

    await press(getByLabelText("Cancel invite, nobody@example.com"));
    await confirmLastAlert();
    await waitFor(() => {
      expect(deleteApiV1SharesInvitesByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "i1" } }),
      );
    });

    await press(getByLabelText("Leave, owner@example.com"));
    await confirmLastAlert();
    await waitFor(() => {
      expect(deleteApiV1SharesByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "s2" } }),
      );
    });
  });

  it("does nothing when the user keeps the share", async () => {
    const { findByLabelText } = await renderWithProviders(<SharingScreen />);

    await press(await findByLabelText("Stop sharing, friend@example.com"));

    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(deleteApiV1SharesByIdMock).not.toHaveBeenCalled();
  });

  it("opens the share sheet for all cards", async () => {
    const { findByText, getByText } = await renderWithProviders(
      <SharingScreen />,
    );

    await press(getByText("Share all my cards"));

    expect(
      await findByText(
        "They will see every card in your wallet, including cards that you add later. They cannot change them. You can stop at any time.",
      ),
    ).toBeTruthy();
  });
});
