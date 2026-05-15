import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import type { GetApiV1CardsResponse } from "@/lib/api-client/gen";
import { getApiV1CardsMock } from "../../test/mocks/api-client";
import { renderWithTheme } from "../../test/render";

/** Bun otherwise executes the real PNG when CardsScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

const testCards = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000099",
    cardNumber: "111",
    label: null,
    view: null,
    brand: {
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "ASOS",
      logoUrl: "https://logo.clearbit.com/asos.com",
      backgroundColor: "#FFFFFF",
    },
    createdAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    userId: "00000000-0000-4000-8000-000000000099",
    cardNumber: "222",
    label: null,
    brand: {
      id: "00000000-0000-4000-8000-0000000000a2",
      name: "Cotton On",
      logoUrl: "https://logo.clearbit.com/cottonon.com",
      backgroundColor: "#FFFFFF",
    },
    createdAt: "2020-01-01T00:00:00.000Z",
  },
] satisfies GetApiV1CardsResponse;

const defaultCardsResponse = {
  data: testCards,
  error: undefined,
};

const mockCardsSuccess = () =>
  getApiV1CardsMock.mockImplementation(() =>
    Promise.resolve(defaultCardsResponse),
  );

mockCardsSuccess();

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    push: ReturnType<typeof mock>;
    back: ReturnType<typeof mock>;
    replace: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { CardsScreen } = await import("./CardsScreen");

describe("CardsScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.push.mockClear();
    __expoRouterMocks.replace.mockClear();
    getApiV1CardsMock.mockClear();
    mockCardsSuccess();
  });

  it("renders search and loyalty cards", async () => {
    const { getByLabelText, getByPlaceholderText } = renderWithTheme(
      <CardsScreen />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });
    expect(getByLabelText("Cotton On")).toBeTruthy();
  });

  it("filters cards by search query", async () => {
    const { getByLabelText, getByPlaceholderText, queryByLabelText } =
      renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "cotton");

    await waitFor(() => {
      expect(queryByLabelText("ASOS")).toBeNull();
      expect(getByLabelText("Cotton On")).toBeTruthy();
    });
  });

  it("navigates to select brand when add button is pressed", async () => {
    const { getByText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByText("+")).toBeTruthy());

    fireEvent.press(getByText("+"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SELECT_BRAND);
  });

  it("navigates to card code when a loyalty card is pressed", async () => {
    const { getByLabelText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.press(getByLabelText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_CODE,
      params: {
        cardNumber: "111",
        view: "1D",
        title: "ASOS",
        logoUrl: "https://logo.clearbit.com/asos.com",
        backgroundColor: "#FFFFFF",
      },
    });
  });

  it("passes 2D view when brand uses QR codes", async () => {
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({
        data: [{ ...testCards[0], view: "2D" }],
        error: undefined,
      }),
    );

    const { getByLabelText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.press(getByLabelText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_CODE,
      params: {
        cardNumber: "111",
        view: "2D",
        title: "ASOS",
        logoUrl: "https://logo.clearbit.com/asos.com",
        backgroundColor: "#FFFFFF",
      },
    });
  });

  it("navigates to settings when settings button is pressed", async () => {
    const { getByLabelText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalled());

    fireEvent.press(getByLabelText("Open settings"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SETTINGS);
  });

  it("shows API error banner when fetch fails", async () => {
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Could not load cards" },
      } as unknown as Awaited<ReturnType<typeof getApiV1CardsMock>>),
    );

    const { getByText, queryByLabelText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => {
      expect(getByText("Could not load cards")).toBeTruthy();
    });
    expect(queryByLabelText("ASOS")).toBeNull();
  });

  it("shows empty state when user has no cards", async () => {
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({ data: [], error: undefined }),
    );

    const { getByText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => {
      expect(getByText("No loyalty cards yet")).toBeTruthy();
      expect(
        getByText("Tap the + button to add your first card."),
      ).toBeTruthy();
    });
  });

  it("shows no-match empty state when search has no results", async () => {
    const { getByLabelText, getByPlaceholderText, getByText } = renderWithTheme(
      <CardsScreen />,
    );

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.changeText(
      getByPlaceholderText("Search cards..."),
      "nonexistent-brand",
    );

    await waitFor(() => {
      expect(getByText("No matching cards")).toBeTruthy();
      expect(getByText("Try a different search.")).toBeTruthy();
    });
  });

  it("filters cards by card number", async () => {
    const { getByLabelText, getByPlaceholderText, queryByLabelText } =
      renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "222");

    await waitFor(() => {
      expect(queryByLabelText("ASOS")).toBeNull();
      expect(getByLabelText("Cotton On")).toBeTruthy();
    });
  });

  it("refetches cards on pull-to-refresh", async () => {
    const { UNSAFE_getByType } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalledTimes(1));

    const { RefreshControl } = await import("react-native");
    const refreshControl = UNSAFE_getByType(RefreshControl);
    fireEvent(refreshControl, "refresh");

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalledTimes(2));
  });
});
