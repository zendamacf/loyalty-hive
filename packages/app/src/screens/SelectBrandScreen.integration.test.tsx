import { beforeEach, describe, expect, it } from "bun:test";

import { act, waitFor } from "@testing-library/react-native";

import { Routes } from "@/constants/routes.constants";
import type { GetApiV1BrandsResponse } from "@/lib/api-client/gen";
import { defaultBrandsResponse } from "../../test/fixtures/brands";
import {
  getApiV1BrandsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import {
  changeText,
  press,
  renderWithProviders,
  renderWithSharedQueryClient,
} from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();

const mockBrandsSuccess = () =>
  getApiV1BrandsMock.mockImplementation(() =>
    Promise.resolve(defaultBrandsResponse),
  );

mockBrandsSuccess();

const { SelectBrandScreen } = await import("./SelectBrandScreen");

describe("[Integration] SelectBrandScreen", () => {
  beforeEach(() => {
    expoRouterMocks.push.mockClear();
    expoRouterMocks.back.mockClear();
    getApiV1BrandsMock.mockClear();
    mockBrandsSuccess();
  });

  it("renders heading and filters brands by query", async () => {
    const {
      getByText,
      getByPlaceholderText,
      getByLabelText,
      queryByLabelText,
    } = await renderWithProviders(<SelectBrandScreen />);

    expect(getByText("Choose a brand")).toBeTruthy();

    await waitFor(() => {
      expect(getApiV1BrandsMock).toHaveBeenCalled();
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    await changeText(getByPlaceholderText("Search brands..."), "uber");

    expect(getByLabelText("Uber Eats")).toBeTruthy();
    expect(queryByLabelText("ASOS")).toBeNull();
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("Close")).toBeTruthy();
    });

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalled();
  });

  it("navigates to scan screen with selected brand", async () => {
    const { getByLabelText } = await renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    await press(getByLabelText("ASOS"));

    expect(expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN,
      params: {
        brandId: "00000000-0000-4000-8000-000000000004",
        brandName: "ASOS",
        defaultView: null,
      },
    });
  });

  it("shows loading state before brands load", async () => {
    getApiV1BrandsMock.mockImplementation(() => new Promise(() => {}));

    const { getByText, getByPlaceholderText, queryByLabelText } =
      await renderWithProviders(<SelectBrandScreen />);

    expect(getByText("Loading brands…")).toBeTruthy();
    expect(getByPlaceholderText("Search brands...").props.editable).toBe(false);
    expect(queryByLabelText("Custom card")).toBeNull();
  });

  it("keeps custom card option visible when search matches no brands", async () => {
    const { getByPlaceholderText, getByLabelText, queryByLabelText } =
      await renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("ASOS")).toBeTruthy();
    });

    await changeText(
      getByPlaceholderText("Search brands..."),
      "no matching brands",
    );

    expect(queryByLabelText("ASOS")).toBeNull();
    expect(getByLabelText("Custom card")).toBeTruthy();
  });

  it("navigates to scan screen for custom card", async () => {
    const { getByLabelText } = await renderWithProviders(<SelectBrandScreen />);

    await waitFor(() => {
      expect(getByLabelText("Custom card")).toBeTruthy();
    });

    await press(getByLabelText("Custom card"));

    expect(expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN,
      params: { customCard: "1" },
    });
  });

  it("refetches brands on pull-to-refresh", async () => {
    const { UNSAFE_getByType, getByLabelText } = await renderWithProviders(
      <SelectBrandScreen />,
    );

    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());
    expect(getApiV1BrandsMock).toHaveBeenCalledTimes(1);

    const { FlatList } = await import("react-native");
    await waitFor(() => {
      expect(UNSAFE_getByType(FlatList)).toBeTruthy();
    });
    const flatList = UNSAFE_getByType(FlatList);
    await act(async () => {
      await flatList.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(getApiV1BrandsMock).toHaveBeenCalledTimes(2));
  });

  it("serves cached brands without refetching on remount within query client stale time", async () => {
    const { queryClient, unmount, getByLabelText } =
      await renderWithSharedQueryClient(<SelectBrandScreen />);

    await waitFor(() => expect(getApiV1BrandsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByLabelText("ASOS")).toBeTruthy());
    unmount();

    const remount = await renderWithSharedQueryClient(
      <SelectBrandScreen />,
      queryClient,
    );
    await waitFor(() => expect(remount.getByLabelText("ASOS")).toBeTruthy());
    expect(getApiV1BrandsMock).toHaveBeenCalledTimes(1);
  });

  it("shows API error when brands fetch fails", async () => {
    getApiV1BrandsMock.mockImplementation((options) =>
      resolveApiMock<GetApiV1BrandsResponse>(
        {
          data: undefined,
          error: { error: "Could not load brands" },
        },
        options,
      ),
    );

    const { getByText, queryByLabelText } = await renderWithProviders(
      <SelectBrandScreen />,
    );

    await waitFor(() => {
      expect(getByText("Could not load brands")).toBeTruthy();
    });
    expect(queryByLabelText("ASOS")).toBeNull();
  });
});
