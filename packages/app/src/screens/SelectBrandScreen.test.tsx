import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render, waitFor } from "@testing-library/react-native";

import type { GetApiV1BrandsResponse } from "@/lib/api-client";

const testBrands = [
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "ASOS",
    logoUrl: "https://logo.clearbit.com/asos.com",
    backgroundColor: "#FFFFFF",
    defaultView: null,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000aa",
    name: "Uber Eats",
    logoUrl: "https://logo.clearbit.com/ubereats.com",
    backgroundColor: "#FFFFFF",
    defaultView: null,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
] satisfies GetApiV1BrandsResponse;

const getApiV1BrandsMock = mock(() =>
  Promise.resolve({
    data: testBrands,
    error: undefined,
  }),
);

mock.module("@/lib/api-client", () => ({
  getApiV1Brands: getApiV1BrandsMock,
}));

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
    getApiV1BrandsMock.mockClear();
  });

  it("renders heading and filters brands by query", async () => {
    const { getByText, getByPlaceholderText, getByLabelText, queryByLabelText } =
      render(<SelectBrandScreen />);

    expect(getByText("Choose a brand")).toBeTruthy();

    await waitFor(() => {
      expect(getApiV1BrandsMock).toHaveBeenCalled();
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText("Search brands..."), "uber");

    expect(getByLabelText("Uber Eats")).toBeTruthy();
    expect(queryByLabelText("ASOS")).toBeNull();
  });

  it("navigates to scan screen with selected brand", async () => {
    const { getByLabelText } = render(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("ASOS"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: "/scan",
      params: {
        brandId: "00000000-0000-4000-8000-000000000004",
        brandName: "ASOS",
      },
    });
  });
});
