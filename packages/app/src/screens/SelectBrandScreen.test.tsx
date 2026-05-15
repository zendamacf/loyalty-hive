import { beforeEach, describe, expect, it, type mock } from "bun:test";

import { fireEvent, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import type { GetApiV1BrandsResponse } from "@/lib/api-client/gen";
import { getApiV1BrandsMock } from "../../test/mocks/api-client";
import { renderWithProviders } from "../../test/render";

const testBrands = [
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "ASOS",
    logoUrl: "https://logo.clearbit.com/asos.com",
    backgroundColor: "#FFFFFF",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000aa",
    name: "Uber Eats",
    logoUrl: "https://logo.clearbit.com/ubereats.com",
    backgroundColor: "#FFFFFF",
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
    __expoRouterMocks.back.mockClear();
    getApiV1BrandsMock.mockClear();
    mockBrandsSuccess();
  });

  it("renders heading and filters brands by query", async () => {
    const {
      getByText,
      getByPlaceholderText,
      getByLabelText,
      queryByLabelText,
    } = renderWithProviders(<SelectBrandScreen />);

    expect(getByText("Choose a brand")).toBeTruthy();

    await waitFor(() => {
      expect(getApiV1BrandsMock).toHaveBeenCalled();
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText("Search brands..."), "uber");

    expect(getByLabelText("Uber Eats")).toBeTruthy();
    expect(queryByLabelText("ASOS")).toBeNull();
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("Close")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });

  it("navigates to scan screen with selected brand", async () => {
    const { getByLabelText } = renderWithProviders(<SelectBrandScreen />);

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

    const { getByText, getByPlaceholderText, queryByLabelText } =
      renderWithProviders(<SelectBrandScreen />);

    expect(getByText("Loading brands…")).toBeTruthy();
    expect(getByPlaceholderText("Search brands...").props.editable).toBe(false);
    expect(queryByLabelText("Custom card")).toBeNull();
  });

  it("keeps custom card option visible when search matches no brands", async () => {
    const { getByPlaceholderText, getByLabelText, queryByLabelText } =
      renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText("Search brands..."),
      "no matching brands",
    );

    expect(queryByLabelText("ASOS")).toBeNull();
    expect(getByLabelText("Custom card")).toBeTruthy();
  });

  it("navigates to scan with custom label after entering label", async () => {
    const { getByLabelText, getByPlaceholderText, getByText } =
      renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("Custom card")).toBeTruthy();
    });

    fireEvent.press(getByLabelText("Custom card"));
    fireEvent.changeText(
      getByPlaceholderText("e.g. Gym membership"),
      "Gym membership",
    );
    fireEvent.press(getByText("Continue to scan"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN,
      params: { label: "Gym membership" },
    });
  });

  it("refetches brands on pull-to-refresh", async () => {
    const { UNSAFE_getByType } = renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => expect(getApiV1BrandsMock).toHaveBeenCalledTimes(1));

    const { RefreshControl } = await import("react-native");
    const refreshControl = UNSAFE_getByType(RefreshControl);
    fireEvent(refreshControl, "refresh");

    await waitFor(() => expect(getApiV1BrandsMock).toHaveBeenCalledTimes(2));
  });

  it("shows API error when brands fetch fails", async () => {
    getApiV1BrandsMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Could not load brands" },
      }),
    );

    const { getByText, queryByLabelText } = renderWithProviders(
      <SelectBrandScreen />,
    );

    await waitFor(() => {
      expect(getByText("Could not load brands")).toBeTruthy();
    });
    expect(queryByLabelText("ASOS")).toBeNull();
  });
});
