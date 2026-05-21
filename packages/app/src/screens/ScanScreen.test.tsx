import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import { Routes } from "@/constants/routes.constants";
import type { PostApiV1CardsResponse } from "@/lib/api-client";
import {
  getConfigMock,
  postApiV1CardsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { renderWithProviders } from "../../test/render";

const testUserId = "00000000-0000-4000-8000-000000000001";
const fakeJwt = `h.${Buffer.from(JSON.stringify({ sub: testUserId })).toString("base64url")}.s`;

const defaultCardSaveResponse = {
  data: {
    id: "card-1",
    userId: testUserId,
    cardNumber: "123456",
    brand: null,
    createdAt: new Date().toISOString(),
  },
  error: undefined,
};

const mockCardSaveSuccess = () =>
  postApiV1CardsMock.mockImplementation(() =>
    Promise.resolve(defaultCardSaveResponse),
  );

mockCardSaveSuccess();

type PermissionState = { granted: boolean } | null;

let permissionState: PermissionState = null;
const requestPermissionMock = mock(() => Promise.resolve());
const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    push: ReturnType<typeof mock>;
    back: ReturnType<typeof mock>;
    dismissTo: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

mock.module("expo-camera", () => ({
  CameraView: (props: Record<string, unknown>) =>
    React.createElement("CameraView", props, props.children as React.ReactNode),
  useCameraPermissions: () => [permissionState, requestPermissionMock] as const,
}));

const { ScanScreen } = await import("./ScanScreen");

describe("ScanScreen", () => {
  beforeEach(() => {
    permissionState = null;
    __expoRouterMocks.push.mockClear();
    __expoRouterMocks.back.mockClear();
    __expoRouterMocks.dismissTo.mockClear();
    requestPermissionMock.mockClear();
    postApiV1CardsMock.mockClear();
    mockCardSaveSuccess();
    getConfigMock.mockImplementation(() => ({ auth: fakeJwt }));
    __expoRouterMocks.params = {
      brandName: "ASOS",
      brandId: "00000000-0000-4000-8000-000000000004",
    };
  });

  it("shows loading message while camera permission is being checked", async () => {
    const { getByText } = await renderWithProviders(<ScanScreen />);

    expect(getByText("Checking camera permissions...")).toBeTruthy();
  });

  it("requests permission when user taps allow camera", async () => {
    permissionState = { granted: false };
    const { getByText } = await renderWithProviders(<ScanScreen />);

    fireEvent.press(getByText("Allow camera"));

    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
  });

  it("navigates to manual entry when enter manually is pressed", async () => {
    permissionState = { granted: true };
    const { getByText } = await renderWithProviders(<ScanScreen />);

    fireEvent.press(getByText("Enter card number manually"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN_MANUAL_ENTRY,
      params: {
        brandId: "00000000-0000-4000-8000-000000000004",
        brandName: "ASOS",
      },
    });
  });

  it("creates a card when a QR code is scanned with 2D view", async () => {
    permissionState = { granted: true };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "987654",
    });

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "987654",
            label: null,
            brandId: "00000000-0000-4000-8000-000000000004",
            view: "2D",
          },
        }),
      );
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("creates a card when a linear barcode is scanned with 1D view", async () => {
    permissionState = { granted: true };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "code128",
      data: "987654",
    });

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "987654",
            label: null,
            brandId: "00000000-0000-4000-8000-000000000004",
            view: "1D",
          },
        }),
      );
    });
  });

  it("shows barcode scan guide when defaultView is 1D", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = {
      ...__expoRouterMocks.params,
      defaultView: "1D",
    };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    expect(getByTestId("scan-guide-1d")).toBeTruthy();
  });

  it("shows QR scan guide when defaultView is 2D", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = {
      ...__expoRouterMocks.params,
      defaultView: "2D",
    };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    expect(getByTestId("scan-guide-2d")).toBeTruthy();
  });

  it("does not show scan guide when defaultView is absent", async () => {
    permissionState = { granted: true };
    const { queryByTestId } = await renderWithProviders(<ScanScreen />);

    expect(queryByTestId("scan-guide-1d")).toBeNull();
    expect(queryByTestId("scan-guide-2d")).toBeNull();
  });

  it("shows brand context when brand name param is set", async () => {
    permissionState = { granted: true };
    const { getByText } = await renderWithProviders(<ScanScreen />);

    expect(getByText("ASOS")).toBeTruthy();
  });

  it("navigates back when close is pressed", async () => {
    permissionState = { granted: true };
    const { getByLabelText } = await renderWithProviders(<ScanScreen />);

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });

  it("navigates to manual entry with scanned number for custom card", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = { customCard: "1" };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "111222",
    });

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN_MANUAL_ENTRY,
      params: {
        customCard: "1",
        cardNumber: "111222",
        view: "2D",
      },
    });
    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });

  it("navigates to manual entry only once when custom barcode is scanned repeatedly", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = { customCard: "1" };
    __expoRouterMocks.push.mockClear();
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    const scanEvent = {
      type: "qr",
      data: "111222",
    };
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);

    expect(__expoRouterMocks.push).toHaveBeenCalledTimes(1);
  });

  it("navigates to manual entry for custom card when enter manually is pressed", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = { customCard: "1" };
    const { getByText } = await renderWithProviders(<ScanScreen />);

    fireEvent.press(getByText("Enter card number manually"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.SCAN_MANUAL_ENTRY,
      params: { customCard: "1" },
    });
  });

  it("shows save error and does not navigate when API returns error", async () => {
    permissionState = { granted: true };
    postApiV1CardsMock.mockImplementation((options) =>
      resolveApiMock<PostApiV1CardsResponse>(
        {
          data: undefined,
          error: { error: "Card already exists" },
        },
        options,
      ),
    );

    const { getByTestId, getByText } = await renderWithProviders(
      <ScanScreen />,
    );

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "987654",
    });

    await waitFor(() => {
      expect(getByText("Card already exists")).toBeTruthy();
    });
    expect(__expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });
});
