import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, waitFor } from "@testing-library/react-native";

/** Bun otherwise executes the real PNG when HomeScreen loads `require(...)`. */
mock.module("../../assets/images/icon.png", () => ({ default: 1 }));

const getApiV1CardsMock = mock(() =>
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

mock.module("@/lib/api-client", () => ({
  getApiV1Cards: getApiV1CardsMock,
}));

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    push: ReturnType<typeof mock>;
    back: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { HomeScreen } = await import("./HomeScreen");

describe("HomeScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.push.mockClear();
    getApiV1CardsMock.mockClear();
  });

  it("renders search and loyalty cards", async () => {
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    await waitFor(() => {
      expect(getByText("ASOS")).toBeTruthy();
    });
    expect(getByText("Cotton On")).toBeTruthy();
  });

  it("filters cards by search query", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <HomeScreen />,
    );

    await waitFor(() => expect(getByText("ASOS")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Search cards..."), "cotton");

    await waitFor(() => {
      expect(queryByText("ASOS")).toBeNull();
      expect(getByText("Cotton On")).toBeTruthy();
    });
  });

  it("navigates to select brand when add button is pressed", async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => expect(getByText("+")).toBeTruthy());

    fireEvent.press(getByText("+"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith("/select-brand");
  });
});
