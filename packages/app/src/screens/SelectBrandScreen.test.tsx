import { beforeEach, describe, expect, it, type mock } from "bun:test";

import { fireEvent, render } from "@testing-library/react-native";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    push: ReturnType<typeof mock>;
    back: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

const { SelectBrandScreen } = await import("./SelectBrandScreen");

describe("SelectBrandScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.push.mockClear();
  });

  it("renders heading and filters brands by query", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <SelectBrandScreen />,
    );

    expect(getByText("Choose a brand")).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText("Search brands..."), "uber");

    expect(getByText("Uber Eats")).toBeTruthy();
    expect(queryByText("ASOS")).toBeNull();
  });

  it("navigates to scan screen with selected brand", () => {
    const { getByText } = render(<SelectBrandScreen />);

    fireEvent.press(getByText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: "/scan",
      params: {
        brandId: "4",
        brandName: "ASOS",
      },
    });
  });
});
