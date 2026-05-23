import { beforeEach, describe, expect, it } from "bun:test";
import { waitFor } from "@testing-library/react-native";
import { Image } from "react-native";

import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import { postApiV1CardsByIdViewMock } from "../../test/mocks/api-client";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();

const { CardCodeScreen } = await import("./CardCodeScreen");

describe("[Integration] CardCodeScreen", () => {
  beforeEach(() => {
    postApiV1CardsByIdViewMock.mockClear();
    expoRouterMocks.back.mockClear();
    expoRouterMocks.push.mockClear();
    expoRouterMocks.params = {
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
    expoRouterMocks.params = {
      ...expoRouterMocks.params,
      [CARD_CODE_FROM_CARDS_PARAM]: CARD_CODE_FROM_CARDS_VALUE,
    };

    await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(postApiV1CardsByIdViewMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
        }),
      );
    });
  });

  it("does not log a card view without the from-cards param", async () => {
    await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(postApiV1CardsByIdViewMock).not.toHaveBeenCalled();
    });
  });

  it("renders a barcode for 1D view", async () => {
    const { getByTestId, UNSAFE_getByType } = await renderWithProviders(
      <CardCodeScreen />,
    );

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
    expect(UNSAFE_getByType(Image).props.source).toEqual({
      uri: "https://logo.clearbit.com/asos.com",
    });
  });

  it("renders a QR code for 2D view", async () => {
    expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByTestId } = await renderWithProviders(<CardCodeScreen />);

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("defaults to barcode when view is missing", async () => {
    expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
    };

    const { getByTestId } = await renderWithProviders(<CardCodeScreen />);

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });

  it("navigates back when close button is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(<CardCodeScreen />);

    await press(getByLabelText("Close"));

    expect(expoRouterMocks.back).toHaveBeenCalled();
  });

  it("navigates to card settings when configure is pressed", async () => {
    const { getByLabelText } = await renderWithProviders(<CardCodeScreen />);

    await press(getByLabelText("Configure card"));

    expect(expoRouterMocks.push).toHaveBeenCalledWith({
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
    const { getByLabelText, getByTestId } = await renderWithProviders(
      <CardCodeScreen />,
    );

    expect(getByTestId("barcode")).toBeTruthy();

    await press(getByLabelText("QR code"));

    expect(getByTestId("qrcode")).toBeTruthy();
    expect(getByTestId("barcode")).toBeTruthy();
  });

  it("switches to barcode when barcode is selected", async () => {
    expoRouterMocks.params = {
      cardNumber: "1234567890",
      title: "ASOS",
      view: "2D",
    };

    const { getByLabelText, getByTestId } = await renderWithProviders(
      <CardCodeScreen />,
    );

    expect(getByTestId("qrcode")).toBeTruthy();

    await press(getByLabelText("Barcode"));

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });
});
