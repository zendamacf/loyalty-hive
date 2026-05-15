import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Routes } from "@/constants/routes.constants";
import { getApiV1CardsMock } from "../../test/mocks/api-client";
import { renderWithTheme } from "../../test/render";

/** Bun otherwise executes the real PNG when CardsScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

getApiV1CardsMock.mockImplementation(() =>
  Promise.resolve({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        userId: "00000000-0000-4000-8000-000000000099",
        cardNumber: "111",
        label: null,
        brand: {
          id: "00000000-0000-4000-8000-0000000000a1",
          name: "ASOS",
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
        },
        createdAt: "2020-01-01T00:00:00.000Z",
      },
    ],
    error: undefined,
  }),
);

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
  });

  it("renders search and loyalty cards", async () => {
    const { getByPlaceholderText, getByText } = renderWithTheme(
      <CardsScreen />,
    );

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    await waitFor(() => {
      expect(getByText("ASOS")).toBeTruthy();
    });
    expect(getByText("Cotton On")).toBeTruthy();
  });

  it("filters cards by search query", async () => {
    const { getByPlaceholderText, getByText, queryByText } = renderWithTheme(
      <CardsScreen />,
    );

    await waitFor(() => expect(getByText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "cotton");

    await waitFor(() => {
      expect(queryByText("ASOS")).toBeNull();
      expect(getByText("Cotton On")).toBeTruthy();
    });
  });

  it("navigates to select brand when add button is pressed", async () => {
    const { getByText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getByText("+")).toBeTruthy());

    fireEvent.press(getByText("+"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SELECT_BRAND);
  });

  it("navigates to settings when settings button is pressed", async () => {
    const { getByLabelText } = renderWithTheme(<CardsScreen />);

    await waitFor(() => expect(getApiV1CardsMock).toHaveBeenCalled());

    fireEvent.press(getByLabelText("Open settings"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith(Routes.SETTINGS);
  });
});
