import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent } from "@testing-library/react-native";
import React from "react";
import { Image } from "react-native";
import { renderWithTheme } from "../../test/render";

const { __expoRouterMocks, __expoClipboardMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
  __expoClipboardMocks: {
    setStringAsync: ReturnType<typeof mock>;
  };
};

mock.module("react-native-barcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("Barcode", { testID: "barcode", ...props }),
}));

mock.module("react-native-qrcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("QRCode", { testID: "qrcode", ...props }),
}));

const { CardCodeScreen } = await import("./CardCodeScreen");

describe("CardCodeScreen", () => {
  beforeEach(() => {
    __expoRouterMocks.back.mockClear();
    __expoClipboardMocks.setStringAsync.mockClear();
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "1D",
      logoUrl: "https://logo.clearbit.com/asos.com",
      backgroundColor: "#FFFFFF",
    };
  });

  it("renders a barcode for 1D view", () => {
    const { getByTestId, getByText, UNSAFE_getByType } = renderWithTheme(
      <CardCodeScreen />,
    );

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
    expect(UNSAFE_getByType(Image).props.source).toEqual({
      uri: "https://logo.clearbit.com/asos.com",
    });
    expect(getByText("1234567890")).toBeTruthy();
  });

  it("renders a QR code for 2D view", () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByTestId } = renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("defaults to barcode when view is missing", () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
    };

    const { getByTestId } = renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });

  it("navigates back when close button is pressed", () => {
    const { getByLabelText } = renderWithTheme(<CardCodeScreen />);

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });

  it("switches to QR code when the toggle is pressed", () => {
    const { getByLabelText, getByTestId } = renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("barcode")).toBeTruthy();

    fireEvent.press(getByLabelText("QR code"));

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("copies card number when copy is pressed", () => {
    const { getByLabelText } = renderWithTheme(<CardCodeScreen />);

    fireEvent.press(getByLabelText("Copy card number"));

    expect(__expoClipboardMocks.setStringAsync).toHaveBeenCalledWith(
      "1234567890",
    );
  });

  it("switches to barcode when the toggle is pressed", () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByLabelText, getByTestId } = renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("qrcode")).toBeTruthy();

    fireEvent.press(getByLabelText("Barcode"));

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });
});
