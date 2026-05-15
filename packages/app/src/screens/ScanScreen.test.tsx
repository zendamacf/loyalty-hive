import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Routes } from "@/constants/routes.constants";
import { getConfigMock, postApiV1CardsMock } from "../../test/mocks/api-client";

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

  it("shows loading message while camera permission is being checked", () => {
    const { getByText } = render(<ScanScreen />);

    expect(getByText("Checking camera permissions...")).toBeTruthy();
  });

  it("requests permission when user taps allow camera", () => {
    permissionState = { granted: false };
    const { getByText } = render(<ScanScreen />);

    fireEvent.press(getByText("Allow camera"));

    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
  });

  it("creates a card from manual entry and returns to cards tab", async () => {
    permissionState = { granted: true };
    const { getByText, getByPlaceholderText } = render(<ScanScreen />);

    fireEvent.press(getByText("Enter card number manually"));
    fireEvent.changeText(getByPlaceholderText("Card number"), " 123456 ");
    fireEvent.press(getByText("Use card number"));

    expect(getByText("Saving card...")).toBeTruthy();

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "123456",
            label: null,
            brandId: "00000000-0000-4000-8000-000000000004",
            view: null,
          },
        }),
      );
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("creates a card when a QR code is scanned with 2D view", async () => {
    permissionState = { granted: true };
    const { getByTestId } = render(<ScanScreen />);

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
    const { getByTestId } = render(<ScanScreen />);

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

  it("shows brand context when brand name param is set", () => {
    permissionState = { granted: true };
    const { getByText } = render(<ScanScreen />);

    expect(getByText("Adding card for ASOS")).toBeTruthy();
  });

  it("creates a custom card with label and no brand", async () => {
    permissionState = { granted: true };
    __expoRouterMocks.params = { label: "Gym membership" };
    const { getByTestId, getByText } = render(<ScanScreen />);

    expect(getByText("Adding Gym membership")).toBeTruthy();

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "111222",
    });

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            cardNumber: "111222",
            label: "Gym membership",
            brandId: null,
            view: "2D",
          },
        }),
      );
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("shows save error and does not navigate when API returns error", async () => {
    permissionState = { granted: true };
    postApiV1CardsMock.mockImplementation(() =>
      Promise.resolve({
        data: undefined,
        error: { error: "Card already exists" },
      }),
    );

    const { getByTestId, getByText } = render(<ScanScreen />);

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "987654",
    });

    await waitFor(() => {
      expect(getByText("Card already exists")).toBeTruthy();
    });
    expect(__expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });

  it("does not save when manual entry is empty", () => {
    permissionState = { granted: true };
    const { getByText } = render(<ScanScreen />);

    fireEvent.press(getByText("Enter card number manually"));
    fireEvent.press(getByText("Use card number"));

    expect(postApiV1CardsMock).not.toHaveBeenCalled();
  });
});
