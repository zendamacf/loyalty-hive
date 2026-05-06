import { beforeEach, describe, expect, it, type mock } from "bun:test";

import { fireEvent, render } from "@testing-library/react-native";

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
  });

  it("renders search and loyalty cards", () => {
    const { getByPlaceholderText, getByText } = render(<HomeScreen />);

    expect(getByPlaceholderText("Search cards...")).toBeTruthy();
    expect(getByText("ASOS")).toBeTruthy();
    expect(getByText("Cotton On")).toBeTruthy();
  });

  it("navigates to select brand when FAB is pressed", () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("+"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith("/select-brand");
  });
});
