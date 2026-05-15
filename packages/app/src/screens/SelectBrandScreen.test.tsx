import { beforeEach, describe, expect, it, type mock } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Routes } from "@/constants/routes.constants";
import type { GetApiV1BrandsResponse } from "@/lib/api-client/gen";
import { getApiV1BrandsMock } from "../../test/mocks/api-client";

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

const defaultBrandsResponse = {
  data: testBrands,
  error: undefined,
};

const mockBrandsSuccess = () =>
  getApiV1BrandsMock.mockImplementation(() =>
    Promise.resolve(defaultBrandsResponse),
  );

mockBrandsSuccess();

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
    mockBrandsSuccess();
  });

  it("renders heading and filters brands by query", async () => {
    const {
      getByText,
      getByPlaceholderText,
      getByLabelText,
      queryByLabelText,
    } = render(<SelectBrandScreen />);

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
      pathname: Routes.SCAN,
      params: {
        brandId: "00000000-0000-4000-8000-000000000004",
        brandName: "ASOS",
      },
    });
  });

  it("shows loading state before brands load", () => {
    getApiV1BrandsMock.mockImplementation(() => new Promise(() => {}));

    const { getByText, getByPlaceholderText } = render(<SelectBrandScreen />);

    expect(getByText("Loading brands…")).toBeTruthy();
    expect(getByPlaceholderText("Search brands...").props.editable).toBe(false);
  });

  it("shows API error when brands fetch fails", async () => {
    getApiV1BrandsMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Could not load brands" },
      }),
    );

    const { getByText, queryByLabelText } = render(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByText("Could not load brands")).toBeTruthy();
    });
    expect(queryByLabelText("ASOS")).toBeNull();
  });
});
