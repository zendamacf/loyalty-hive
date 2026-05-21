import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import type { PostApiV1CardsResponse } from "@/lib/api-client";
import {
  getConfigMock,
  postApiV1CardsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { renderWithProviders } from "../../test/render";

const testUserId = "00000000-0000-4000-8000-000000000001";
const fakeJwt = `h.${Buffer.from(JSON.stringify({ sub: testUserId })).toString("base64url")}.s`;

const defaultCardSaveResponse = {
  data: {
    id: "card-1",
    userId: testUserId,
    cardNumber: "123456",
    brand: null,
    createdAt: new Date().toISOString(),
  },
  error: undefined,
};

const mockCardSaveSuccess = () =>
  postApiV1CardsMock.mockImplementation(() =>
    Promise.resolve(defaultCardSaveResponse),
  );

mockCardSaveSuccess();

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof mock>;
    dismissTo: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { ScanManualEntryScreen } = await import("./ScanManualEntryScreen");

describe("ScanManualEntryScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.back.mockClear();
    __expoRouterMocks.dismissTo.mockClear();
    postApiV1CardsMock.mockClear();
    mockCardSaveSuccess();
    getConfigMock.mockImplementation(() => ({ auth: fakeJwt }));
    __expoRouterMocks.params = {
      brandName: "ASOS",
      brandId: "00000000-0000-4000-8000-000000000004",
    };
  });

  it("shows help text and card number field", async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    expect(
      getByText("Enter the card number printed on your card"),
    ).toBeTruthy();
    expect(getByPlaceholderText("Card number")).toBeTruthy();
  });

  it("creates a card from manual entry and returns to cards tab", async () => {
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Card number"), " 123456 ");
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
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("shows brand context when brand name param is set", async () => {
    const { getByText } = await renderWithProviders(<ScanManualEntryScreen />);

    expect(getByText("ASOS")).toBeTruthy();
  });

  it("creates a custom card with label and no brand", async () => {
    __expoRouterMocks.params = { label: "Gym membership" };
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    expect(getByText("Gym membership")).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText("Card number"), "111222");
    fireEvent.press(getByText("Add"));

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "111222",
            label: "Gym membership",
            brandId: null,
            view: null,
          },
        }),
      );
    });
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
      <ScanManualEntryScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Card number"), "987654");
    fireEvent.press(getByText("Add"));

    await waitFor(() => {
      expect(getByText("Card already exists")).toBeTruthy();
    });
    expect(__expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });

  it("does not save when card number is empty", async () => {
    const { getByText } = await renderWithProviders(<ScanManualEntryScreen />);

    fireEvent.press(getByText("Add"));

    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });

  it("navigates back when close is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });
});
