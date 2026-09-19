import { beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Routes } from "@/constants/routes.constants";
import {
  postApiV1BrandRequestsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { isInitializedMock, trackEventMock } from "../../test/mocks/expo-umami";
import { changeText, press, renderWithProviders } from "../../test/render";
import { SheetIds } from "./sheetIds";

const expoRouterMocks = getExpoRouterMocks();

describe("[Integration] RequestBrandSheet", () => {
  beforeEach(async () => {
    await SheetManager.hide(SheetIds.REQUEST_BRAND);
    expoRouterMocks.push.mockClear();
    postApiV1BrandRequestsMock.mockClear();
    trackEventMock.mockClear();
    isInitializedMock.mockReturnValue(true);
  });

  it("submits a brand request and tracks the analytics event", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.REQUEST_BRAND, {
        payload: { requestedName: "Coles" },
      });
    });

    await waitFor(() => {
      expect(getByText("Request a brand")).toBeTruthy();
      expect(getByLabelText("Brand name").props.value).toBe("Coles");
    });

    await changeText(
      getByLabelText("Loyalty program URL"),
      "https://www.coles.com.au/loyalty",
    );
    await changeText(getByLabelText("Notes (optional)"), "Popular in AU");

    await press(getByText("Submit request"));

    await waitFor(() => {
      expect(postApiV1BrandRequestsMock).toHaveBeenCalled();
      expect(getByText("Request submitted")).toBeTruthy();
    });

    expect(trackEventMock).toHaveBeenCalledWith("/brand-request", {
      eventName: "brand_request_submitted",
      title: "Brand Request Submitted",
      data: {
        request_id: "00000000-0000-4000-8000-000000000010",
        requested_name: "Requested Brand",
        url_host: "example.com",
        has_notes: false,
        source: "empty_search",
      },
    });
  });

  it("navigates to linked custom card scan after a successful request", async () => {
    postApiV1BrandRequestsMock.mockImplementation((options) =>
      resolveApiMock(
        {
          data: {
            id: "00000000-0000-4000-8000-000000000099",
            requestedName: "Woolworths",
            url: "https://www.woolworths.com.au/rewards",
            notes: null,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          error: undefined,
        },
        options,
      ),
    );

    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.REQUEST_BRAND, {
        payload: { requestedName: "Woolworths" },
      });
    });

    await waitFor(() => {
      expect(getByLabelText("Brand name")).toBeTruthy();
    });

    await changeText(
      getByLabelText("Loyalty program URL"),
      "https://www.woolworths.com.au/rewards",
    );
    await press(getByText("Submit request"));

    await waitFor(() => {
      expect(getByText("Add custom card now")).toBeTruthy();
    });

    await press(getByText("Add custom card now"));

    expect(expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN,
      params: {
        customCard: "1",
        brandRequestId: "00000000-0000-4000-8000-000000000099",
        suggestedLabel: "Woolworths",
      },
    });
  });

  it("closes after a successful request when done is pressed", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <View testID="sheet-host" />,
    );

    await act(async () => {
      void SheetManager.show(SheetIds.REQUEST_BRAND, {
        payload: { requestedName: "Done Test Brand" },
      });
    });

    await waitFor(() => {
      expect(getByLabelText("Brand name")).toBeTruthy();
    });

    await changeText(
      getByLabelText("Loyalty program URL"),
      "https://example.com/done-test-brand",
    );
    await press(getByText("Submit request"));

    await waitFor(() => {
      expect(getByText("Done")).toBeTruthy();
    });

    await press(getByText("Done"));
  });
});
