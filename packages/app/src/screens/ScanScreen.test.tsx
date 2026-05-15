import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Routes } from "@/constants/routes.constants";
import { getConfigMock, postApiV1CardsMock } from "../../test/mocks/api-client";

const testUserId = "00000000-0000-4000-8000-000000000001";
const fakeJwt = `h.${Buffer.from(JSON.stringify({ sub: testUserId })).toString("base64url")}.s`;

postApiV1CardsMock.mockImplementation(() =>
  Promise.resolve({
    data: {
      id: "card-1",
      userId: testUserId,
      cardNumber: "123456",
      brand: null,
      createdAt: new Date().toISOString(),
    },
    error: undefined,
  }),
);

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
    getConfigMock.mockImplementation(() => ({ auth: fakeJwt }));
    __expoRouterMocks.params = { brandName: "ASOS" };
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
      expect(postApiV1CardsMock).toHaveBeenCalledTimes(1);
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });

  it("creates a card when a barcode is scanned", async () => {
    permissionState = { granted: true };
    const { getByTestId } = render(<ScanScreen />);

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "987654",
    });

    await waitFor(() => {
      expect(postApiV1CardsMock).toHaveBeenCalledTimes(1);
      expect(__expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
    });
  });
});
