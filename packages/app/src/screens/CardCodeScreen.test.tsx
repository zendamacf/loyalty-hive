import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";
import { Image } from "react-native";

import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import { postApiV1CardsByIdViewMock } from "../../test/mocks/api-client";
import { renderWithTheme } from "../../test/render";

const { __expoRouterMocks } = globalThis as unknown as {
  __expoRouterMocks: {
    back: ReturnType<typeof mock>;
    push: ReturnType<typeof mock>;
    params: Record<string, string | undefined>;
  };
};

mock.module("react-native-barcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("Barcode", props),
}));

mock.module("react-native-qrcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("QRCode", { testID: "qrcode", ...props }),
}));

const { CardCodeScreen } = await import("./CardCodeScreen");

describe("CardCodeScreen", () => {
  beforeEach(() => {
    postApiV1CardsByIdViewMock.mockClear();
    __expoRouterMocks.back.mockClear();
    __expoRouterMocks.push.mockClear();
    __expoRouterMocks.params = {
      id: "00000000-0000-4000-8000-000000000001",
      cardNumber: "1234567890",
      title: "ASOS",
      brandName: "ASOS",
      label: "",
      createdAt: "2020-01-01T00:00:00.000Z",
      view: "1D",
      logoUrl: "https://logo.clearbit.com/asos.com",
      backgroundColor: "#FFFFFF",
    };
  });

  it("logs a card view when opened from the cards list", async () => {
    __expoRouterMocks.params = {
      ...__expoRouterMocks.params,
      [CARD_CODE_FROM_CARDS_PARAM]: CARD_CODE_FROM_CARDS_VALUE,
    };

    await renderWithTheme(<CardCodeScreen />);

    await waitFor(() => {
      expect(postApiV1CardsByIdViewMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
        }),
      );
    });
  });

  it("does not log a card view without the from-cards param", async () => {
    await renderWithTheme(<CardCodeScreen />);

    await waitFor(() => {
      expect(postApiV1CardsByIdViewMock).not.toHaveBeenCalled();
    });
  });

  it("renders a barcode for 1D view", async () => {
    const { getByTestId, UNSAFE_getByType } = await renderWithTheme(
      <CardCodeScreen />,
    );

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
    expect(UNSAFE_getByType(Image).props.source).toEqual({
      uri: "https://logo.clearbit.com/asos.com",
    });
  });

  it("renders a QR code for 2D view", async () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByTestId } = await renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("defaults to barcode when view is missing", async () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
    };

    const { getByTestId } = await renderWithTheme(<CardCodeScreen />);

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = await renderWithTheme(<CardCodeScreen />);

    fireEvent.press(getByLabelText("Close"));

    expect(__expoRouterMocks.back).toHaveBeenCalled();
  });

  it("navigates to card settings when configure is pressed", async () => {
    const { getByLabelText } = await renderWithTheme(<CardCodeScreen />);

    fireEvent.press(getByLabelText("Configure card"));

    expect(__expoRouterMocks.push).toHaveBeenCalledWith({
      pathname: Routes.CARD_SETTINGS,
      params: {
        id: "00000000-0000-4000-8000-000000000001",
        cardNumber: "1234567890",
        brandName: "ASOS",
        label: "",
        createdAt: "2020-01-01T00:00:00.000Z",
      },
    });
  });

  it("switches to QR code when QR code is selected", async () => {
    const { getByLabelText, getByTestId } = await renderWithTheme(
      <CardCodeScreen />,
    );

    expect(getByTestId("barcode")).toBeTruthy();

    fireEvent.press(getByLabelText("QR code"));

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("switches to barcode when barcode is selected", async () => {
    __expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByLabelText, getByTestId } = await renderWithTheme(
      <CardCodeScreen />,
    );

    expect(getByTestId("qrcode")).toBeTruthy();

    fireEvent.press(getByLabelText("Barcode"));

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });
});
