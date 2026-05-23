import { beforeEach, describe, expect, it } from "bun:test";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Routes } from "@/constants/routes.constants";
import type { PostApiV1CardsResponse } from "@/lib/api-client";
import {
  createCardMock,
  getConfigMock,
  postApiV1CardsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { changeText, press, renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

const expoRouterMocks = getExpoRouterMocks();

const testUserId = "00000000-0000-4000-8000-000000000001";
const fakeJwt = `h.${Buffer.from(JSON.stringify({ sub: testUserId })).toString("base64url")}.s`;

const defaultCardSaveResponse = {
  data: createCardMock({ userId: testUserId }),
  error: undefined,
};

const mockCardSaveSuccess = () =>
  postApiV1CardsMock.mockImplementation(() =>
    Promise.resolve(defaultCardSaveResponse),
  );

mockCardSaveSuccess();

describe("[Integration] ScanManualEntrySheet", () => {
  beforeEach(async () => {
    await SheetManager.hide(SheetIds.SCAN_MANUAL_ENTRY);
    expoRouterMocks.dismissTo.mockClear();
    postApiV1CardsMock.mockClear();
    mockCardSaveSuccess();
    getConfigMock.mockImplementation(() => ({ auth: fakeJwt }));
  });

  it("shows help text and card number field when open", async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          brandName: "ASOS",
          brandId: "00000000-0000-4000-8000-000000000004",
        },
      });
    });

    await waitFor(() => {
      expect(getByText("ASOS")).toBeTruthy();
      expect(
        getByText("Enter the card number printed on your card"),
      ).toBeTruthy();
      expect(getByPlaceholderText("Card number")).toBeTruthy();
    });
  });

  it("creates a card from manual entry and returns to cards tab", async () => {
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          brandName: "ASOS",
          brandId: "00000000-0000-4000-8000-000000000004",
        },
      });
    });

    await waitFor(() => {
      expect(getByPlaceholderText("Card number")).toBeTruthy();
    });

    await changeText(getByPlaceholderText("Card number"), " 123456 ");
    fireEvent.press(getByText("Add"));

    expect(getByText("Saving card...")).toBeTruthy();

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "123456",
            label: null,
            brandId: "00000000-0000-4000-8000-000000000004",
            view: null,
          },
        }),
      );
      expect(expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("pre-fills card number from scan payload", async () => {
    const { getByDisplayValue } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          isCustomCard: true,
          initialCardNumber: "998877",
          cardView: "2D",
        },
      });
    });

    await waitFor(() => {
      expect(getByDisplayValue("998877")).toBeTruthy();
    });
  });

  it("shows card name field for custom cards", async () => {
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: { isCustomCard: true },
      });
    });

    await waitFor(() => {
      expect(getByText("Card name")).toBeTruthy();
      expect(getByPlaceholderText("Card name")).toBeTruthy();
    });
  });

  it("creates a custom card with label and scanned view", async () => {
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          isCustomCard: true,
          initialCardNumber: "111222",
          cardView: "2D",
        },
      });
    });

    await waitFor(() => {
      expect(getByPlaceholderText("Card name")).toBeTruthy();
    });

    await changeText(
      getByPlaceholderText("Card name"),
      "Gym membership",
    );
    await press(getByText("Add"), { flushLayout: false });

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "111222",
            label: "Gym membership",
            brandId: null,
            view: "2D",
          },
        }),
      );
      expect(expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("does not save custom card when card name is empty", async () => {
    const { getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: { isCustomCard: true, initialCardNumber: "111222" },
      });
    });

    await waitFor(() => {
      expect(getByText("Add")).toBeTruthy();
    });

    await press(getByText("Add"));

    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });

  it("shows save error and does not navigate when API returns error", async () => {
    postApiV1CardsMock.mockImplementation((options) =>
      resolveApiMock<PostApiV1CardsResponse>(
        {
          data: undefined,
          error: { error: "Card already exists" },
        },
        options,
      ),
    );

    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          brandId: "00000000-0000-4000-8000-000000000004",
        },
      });
    });

    await waitFor(() => {
      expect(getByPlaceholderText("Card number")).toBeTruthy();
    });

    await changeText(getByPlaceholderText("Card number"), "987654");
    await press(getByText("Add"));

    await waitFor(() => {
      expect(getByText("Card already exists")).toBeTruthy();
    });
    expect(expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });

  it("does not save when card number is empty", async () => {
    const { getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.SCAN_MANUAL_ENTRY, {
        payload: {
          brandId: "00000000-0000-4000-8000-000000000004",
        },
      });
    });

    await waitFor(() => {
      expect(getByText("Add")).toBeTruthy();
    });

    await press(getByText("Add"));

    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });
});
