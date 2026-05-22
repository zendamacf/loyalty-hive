import { beforeEach, describe, expect, it, type mock } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import type { PostApiV1CardsResponse } from "@/lib/api-client";
import {
  createCardMock,
  getConfigMock,
  postApiV1CardsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { changeText, press, renderWithProviders } from "../../test/render";

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

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof mock>;
    dismissTo: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { ScanManualEntryScreen } = await import("./ScanManualEntryScreen");

describe("[Integration] ScanManualEntryScreen", () => {
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

  it("pre-fills card number from scan params", async () => {
    __expoRouterMocks.params = {
      customCard: "1",
      cardNumber: "998877",
      view: "2D",
    };
    const { getByDisplayValue } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    expect(getByDisplayValue("998877")).toBeTruthy();
  });

  it("shows card name field for custom cards", async () => {
    __expoRouterMocks.params = { customCard: "1" };
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    expect(getByText("Card name")).toBeTruthy();
    expect(getByPlaceholderText("e.g. Gym membership")).toBeTruthy();
  });

  it("creates a custom card with label and scanned view", async () => {
    __expoRouterMocks.params = {
      customCard: "1",
      cardNumber: "111222",
      view: "2D",
    };
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    await changeText(
      getByPlaceholderText("e.g. Gym membership"),
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
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("does not save custom card when card name is empty", async () => {
    __expoRouterMocks.params = { customCard: "1", cardNumber: "111222" };
    const { getByText } = await renderWithProviders(<ScanManualEntryScreen />);

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
      <ScanManualEntryScreen />,
    );

    await changeText(getByPlaceholderText("Card number"), "987654");
    await press(getByText("Add"));

    await waitFor(() => {
      expect(getByText("Card already exists")).toBeTruthy();
    });
    expect(__expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });

  it("does not save when card number is empty", async () => {
    const { getByText } = await renderWithProviders(<ScanManualEntryScreen />);

    await press(getByText("Add"));

    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });

  it("navigates back when close is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(
      <ScanManualEntryScreen />,
    );

    await press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });
});
