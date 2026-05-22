import { beforeEach, describe, expect, it, mock } from "bun:test";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import type { GetApiV1CardsResponse } from "@/lib/api-client/gen";
import { CARD_SORT_STORAGE_KEY } from "@/lib/card-sort";

import { colors } from "@/theme/theme";
import { THEME_STORAGE_KEY } from "@/theme/theme.constants";
import { getApiV1CardsMock, resolveApiMock } from "../../test/mocks/api-client";
import {
  renderWithSharedQueryClient,
  renderWithTheme,
} from "../../test/render";

/** Bun otherwise executes the real PNG when CardsScreen loads `require(...)`. */
mock.module("../../assets/icon.png", () => ({ default: 1 }));

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
    viewCount: 0,
    lastViewedAt: null,
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
    viewCount: 0,
    lastViewedAt: null,
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
  beforeEach(async () => {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    await AsyncStorage.removeItem(CARD_SORT_STORAGE_KEY);
    __expoRouterMocks.push.mockClear();
    __expoRouterMocks.replace.mockClear();
    getApiV1CardsMock.mockClear();
    mockCardsSuccess();
  });

  it("renders search and loyalty cards", async () => {
    const { getByLabelText, getByPlaceholderText } = await renderWithTheme(
      <CardsScreen />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });
    expect(getByLabelText("Cotton On")).toBeTruthy();
  });

  it("renders sort icon beside the search bar", async () => {
    const { getByLabelText, getByPlaceholderText, getByText } =
      await renderWithTheme(<CardsScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    });
    expect(getByLabelText("Sort by")).toBeTruthy();

    fireEvent.press(getByLabelText("Sort by"));

    await waitFor(() => {
      expect(getByText("A-Z")).toBeTruthy();
    });
  });

  it("loads persisted sort preference on mount", async () => {
    await AsyncStorage.setItem(CARD_SORT_STORAGE_KEY, "most_viewed");

    await renderWithTheme(<CardsScreen />);

    await waitFor(() => {
      expect(getApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { sort: "most_viewed" },
        }),
      );
    });
  });

  it("refetches cards with sort query when sort option changes", async () => {
    const { getByLabelText, getByText } = await renderWithTheme(
      <CardsScreen />,
    );

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalled());
    const initialCall = getApiV1CardsMock.mock.calls[0]?.[0] as
      | { query?: { sort?: string } }
      | undefined;
    expect(initialCall?.query?.sort).toBe("alphabetical");

    fireEvent.press(getByLabelText("Sort by"));
    fireEvent.press(getByText("Most viewed"));

    await waitFor(() => {
      const lastCall = getApiV1CardsMock.mock.calls.at(-1)?.[0] as
        | { query?: { sort?: string } }
        | undefined;
      expect(lastCall?.query?.sort).toBe("most_viewed");
    });

    expect(await AsyncStorage.getItem(CARD_SORT_STORAGE_KEY)).toBe(
      "most_viewed",
    );
  });

  it("filters cards by search query", async () => {
    const { getByLabelText, getByPlaceholderText, queryByLabelText } =
      await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "cotton");

    await waitFor(() => {
      expect(queryByLabelText("ASOS")).toBeNull();
      expect(getByLabelText("Cotton On")).toBeTruthy();
    });
  });

  it("navigates to select brand when add button is pressed", async () => {
    const { getByText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByText("+")).toBeTruthy());

    fireEvent.press(getByText("+"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SELECT_BRAND);
  });

  it("uses theme card fallback background for brand-less cards", async () => {
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            id: "00000000-0000-4000-8000-0000000000c1",
            userId: "00000000-0000-4000-8000-000000000099",
            cardNumber: "333",
            label: "Gym membership",
            view: null,
            brand: null,
            viewCount: 0,
            lastViewedAt: null,
            createdAt: "2020-01-01T00:00:00.000Z",
          },
        ],
        error: undefined,
      }),
    );

    const { getByLabelText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("Gym membership")).toBeTruthy());

    fireEvent.press(getByLabelText("Gym membership"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_CODE,
      params: {
        id: "00000000-0000-4000-8000-0000000000c1",
        cardNumber: "333",
        view: "1D",
        title: "Gym membership",
        brandName: "",
        label: "Gym membership",
        createdAt: "2020-01-01T00:00:00.000Z",
        logoUrl: "",
        backgroundColor: colors.cardFallbackLight,
        [CARD_CODE_FROM_CARDS_PARAM]: CARD_CODE_FROM_CARDS_VALUE,
      },
    });
  });

  it("navigates to card code when a loyalty card is pressed", async () => {
    const { getByLabelText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.press(getByLabelText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_CODE,
      params: {
        id: "00000000-0000-4000-8000-000000000001",
        cardNumber: "111",
        view: "1D",
        title: "ASOS",
        brandName: "ASOS",
        label: "",
        createdAt: "2020-01-01T00:00:00.000Z",
        logoUrl: "https://logo.clearbit.com/asos.com",
        backgroundColor: "#FFFFFF",
        [CARD_CODE_FROM_CARDS_PARAM]: CARD_CODE_FROM_CARDS_VALUE,
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

    const { getByLabelText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.press(getByLabelText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_CODE,
      params: {
        id: "00000000-0000-4000-8000-000000000001",
        cardNumber: "111",
        view: "2D",
        title: "ASOS",
        brandName: "ASOS",
        label: "",
        createdAt: "2020-01-01T00:00:00.000Z",
        logoUrl: "https://logo.clearbit.com/asos.com",
        backgroundColor: "#FFFFFF",
        [CARD_CODE_FROM_CARDS_PARAM]: CARD_CODE_FROM_CARDS_VALUE,
      },
    });
  });

  it("navigates to settings when settings button is pressed", async () => {
    const { getByLabelText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalled());

    fireEvent.press(getByLabelText("Open settings"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SETTINGS);
  });

  it("shows API error banner when fetch fails", async () => {
    getApiV1CardsMock.mockImplementation((options) =>
      resolveApiMock<GetApiV1CardsResponse>(
        {
          data: undefined,
          error: { error: "Could not load cards" },
        },
        options,
      ),
    );

    const { getByText, queryByLabelText } = await renderWithTheme(
      <CardsScreen />,
    );

    await waitFor(() => {
      expect(getByText("Could not load cards")).toBeTruthy();
    });
    expect(queryByLabelText("ASOS")).toBeNull();
  });

  it("shows empty state when user has no cards", async () => {
    getApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({ data: [], error: undefined }),
    );

    const { getByText } = await renderWithTheme(<CardsScreen />);

    await waitFor(() => {
      expect(getByText("No loyalty cards yet")).toBeTruthy();
      expect(
        getByText("Tap the + button to add your first card."),
      ).toBeTruthy();
    });
  });

  it("shows no-match empty state when search has no results", async () => {
    const { getByLabelText, getByPlaceholderText, getByText } =
      await renderWithTheme(<CardsScreen />);

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
      await renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "222");

    await waitFor(() => {
      expect(queryByLabelText("ASOS")).toBeNull();
      expect(getByLabelText("Cotton On")).toBeTruthy();
    });
  });

  it("refetches cards on pull-to-refresh", async () => {
    const { UNSAFE_getByType, getByLabelText } = await renderWithTheme(
      <CardsScreen />,
    );

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());
    expect(getApiV1CardsMock).toHaveBeenCalledTimes(1);

    const { FlatList } = await import("react-native");
    await waitFor(() => {
      expect(UNSAFE_getByType(FlatList)).toBeTruthy();
    });
    const flatList = UNSAFE_getByType(FlatList);
    await act(async () => {
      await flatList.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalledTimes(2));
  });

  it("serves cached cards without refetching on remount within query client stale time", async () => {
    const { queryClient, unmount, getByLabelText } =
      await renderWithSharedQueryClient(<CardsScreen />);

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());
    unmount();

    const remount = await renderWithSharedQueryClient(
      <CardsScreen />,
      queryClient,
    );
    await waitFor(() => expect(remount.getByLabelText("ASOS")).toBeTruthy());
    expect(getApiV1CardsMock).toHaveBeenCalledTimes(1);
  });
});
