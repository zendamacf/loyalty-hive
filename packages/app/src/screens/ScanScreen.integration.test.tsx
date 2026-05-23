import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";

import { Routes } from "@/constants/routes.constants";
import type { PostApiV1CardsResponse } from "@/lib/api-client";
import {
  createCardMock,
  getConfigMock,
  postApiV1CardsMock,
  resolveApiMock,
} from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();

const testUserId = "00000000-0000-4000-8000-000000000001";
const fakeJwt = `h.${Buffer.from(JSON.stringify({ sub: testUserId })).toString("base64url")}.s`;

const defaultCardSaveResponse = {
  data: createCardMock({ userId: testUserId }),
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
const pausePreviewMock = mock(() => Promise.resolve());
const resumePreviewMock = mock(() => Promise.resolve());

mock.module("expo-camera", () => ({
  CameraView: React.forwardRef<
    { pausePreview: () => Promise<void>; resumePreview: () => Promise<void> },
    Record<string, unknown>
  >((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      pausePreview: pausePreviewMock,
      resumePreview: resumePreviewMock,
    }));
    return React.createElement(
      "CameraView",
      { testID: "scan-camera", ...props },
      props.children as React.ReactNode,
    );
  }),
  useCameraPermissions: () => [permissionState, requestPermissionMock] as const,
}));

const { ScanScreen } = await import("./ScanScreen");

describe("[Integration] ScanScreen", () => {
  beforeEach(() => {
    permissionState = null;
    expoRouterMocks.push.mockClear();
    expoRouterMocks.back.mockClear();
    expoRouterMocks.dismissTo.mockClear();
    requestPermissionMock.mockClear();
    pausePreviewMock.mockClear();
    resumePreviewMock.mockClear();
    postApiV1CardsMock.mockClear();
    mockCardSaveSuccess();
    getConfigMock.mockImplementation(() => ({ auth: fakeJwt }));
    expoRouterMocks.params = {
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

    await press(getByText("Allow camera"));

    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
  });

  it("opens manual entry sheet when enter manually is pressed", async () => {
    permissionState = { granted: true };
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ScanScreen />,
    );

    await press(getByText("Enter card number manually"));

    await waitFor(() => {
      expect(
        getByText("Enter the card number printed on your card"),
      ).toBeTruthy();
      expect(getByPlaceholderText("Card number")).toBeTruthy();
    });
    expect(expoRouterMocks.push).not.toHaveBeenCalled();
  });

  it("pauses the camera while manual entry sheet is open", async () => {
    permissionState = { granted: true };
    const { getByTestId, getByText } = await renderWithProviders(
      <ScanScreen />,
    );

    expect(getByTestId("scan-camera").props.onBarcodeScanned).toBeDefined();

    await press(getByText("Enter card number manually"));

    await waitFor(() => {
      expect(pausePreviewMock).toHaveBeenCalled();
      expect(getByTestId("scan-camera").props.onBarcodeScanned).toBeUndefined();
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
      expect(expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS);
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
    expoRouterMocks.params = {
      ...expoRouterMocks.params,
      defaultView: "1D",
    };
    const { getByTestId } = await renderWithProviders(<ScanScreen />);

    expect(getByTestId("scan-guide-1d")).toBeTruthy();
  });

  it("shows QR scan guide when defaultView is 2D", async () => {
    permissionState = { granted: true };
    expoRouterMocks.params = {
      ...expoRouterMocks.params,
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
    const { getAllByText } = await renderWithProviders(<ScanScreen />);

    expect(getAllByText("ASOS").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates back when close is pressed", async () => {
    permissionState = { granted: true };
    const { getByLabelText } = await renderWithProviders(<ScanScreen />);

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalled();
  });

  it("opens manual entry sheet with scanned number for custom card", async () => {
    permissionState = { granted: true };
    expoRouterMocks.params = { customCard: "1" };
    const { getByDisplayValue, getByTestId } = await renderWithProviders(
      <ScanScreen />,
    );

    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", {
      type: "qr",
      data: "111222",
    });

    await waitFor(() => {
      expect(getByDisplayValue("111222")).toBeTruthy();
    });
    expect(postApiV1CardsMock).not.toHaveBeenCalled();
    expect(expoRouterMocks.push).not.toHaveBeenCalled();
  });

  it("opens manual entry sheet only once when custom barcode is scanned repeatedly", async () => {
    permissionState = { granted: true };
    expoRouterMocks.params = { customCard: "1" };
    const { getAllByDisplayValue, getByTestId } = await renderWithProviders(
      <ScanScreen />,
    );

    const scanEvent = {
      type: "qr",
      data: "111222",
    };
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);
    await waitFor(() => {
      expect(getAllByDisplayValue("111222").length).toBe(1);
    });
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);
    fireEvent(getByTestId("scan-camera"), "onBarcodeScanned", scanEvent);

    expect(getAllByDisplayValue("111222").length).toBe(1);
  });

  it("opens manual entry sheet for custom card when enter manually is pressed", async () => {
    permissionState = { granted: true };
    expoRouterMocks.params = { customCard: "1" };
    const { getAllByText, getByPlaceholderText, getByText } =
      await renderWithProviders(<ScanScreen />);

    await press(getAllByText("Enter card number manually")[0]);

    await waitFor(() => {
      expect(getByText("Card name")).toBeTruthy();
      expect(getByPlaceholderText("Card name")).toBeTruthy();
    });
    expect(expoRouterMocks.push).not.toHaveBeenCalled();
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
    expect(expoRouterMocks.dismissTo).not.toHaveBeenCalled();
  });
});
