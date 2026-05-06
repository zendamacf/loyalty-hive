import { beforeEach, describe, expect, it, mock } from "bun:test";

import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

type PermissionState = { granted: boolean } | null;

let permissionState: PermissionState = null;
const requestPermissionMock = mock(() => Promise.resolve());
const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    push: ReturnType<typeof mock>;
    back: ReturnType<typeof mock>;
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
    requestPermissionMock.mockClear();
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

  it("supports manual card entry and done action", () => {
    permissionState = { granted: true };
    const { getByText, getByPlaceholderText } = render(<ScanScreen />);

    fireEvent.press(getByText("Enter card number manually"));
    fireEvent.changeText(getByPlaceholderText("Card number"), " 123456 ");
    fireEvent.press(getByText("Use card number"));

    expect(getByText("Code captured")).toBeTruthy();
    expect(getByText("Value: 123456")).toBeTruthy();

    fireEvent.press(getByText("Done"));

    expect(__expoRouterMocks.back).toHaveBeenCalledTimes(1);
  });
});
