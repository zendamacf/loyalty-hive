import { beforeEach, describe, expect, it } from "bun:test";
import { act, waitFor } from "@testing-library/react-native";
import { Image } from "react-native";

import {
  CARD_CODE_FROM_CARDS_PARAM,
  CARD_CODE_FROM_CARDS_VALUE,
  Routes,
} from "@/constants/routes.constants";
import {
  deleteApiV1CardsByIdMock,
  patchApiV1CardsByIdMock,
  postApiV1CardsByIdViewMock,
} from "../../test/mocks/api-client";
import { getExpoBrightnessMocks } from "../../test/mocks/expo-brightness";
import { getExpoRouterMocks } from "../../test/mocks/expo-router";
import { getNavigationFocusMocks } from "../../test/mocks/navigation-focus";
import { press, renderWithProviders } from "../../test/render";

const expoRouterMocks = getExpoRouterMocks();
const brightnessMocks = getExpoBrightnessMocks();
const focusMocks = getNavigationFocusMocks();

const { CardCodeScreen } = await import("./CardCodeScreen");

describe("[Integration] CardCodeScreen", () => {
  beforeEach(() => {
    postApiV1CardsByIdViewMock.mockClear();
    deleteApiV1CardsByIdMock.mockClear();
    patchApiV1CardsByIdMock.mockClear();
    expoRouterMocks.dismissTo.mockClear();
    expoRouterMocks.back.mockClear();
    expoRouterMocks.push.mockClear();
    brightnessMocks.getBrightnessAsync.mockClear();
    brightnessMocks.setBrightnessAsync.mockClear();
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

  it("sets brightness to max when the screen is focused", async () => {
    await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(brightnessMocks.getBrightnessAsync).toHaveBeenCalled();
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(1);
    });
  });

  it("restores brightness when the screen loses focus", async () => {
    await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(1);
    });

    brightnessMocks.setBrightnessAsync.mockClear();
    focusMocks.blur();

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(0.5);
    });
  });

  it("sets brightness to max again when the screen regains focus", async () => {
    await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(1);
    });

    focusMocks.blur();
    brightnessMocks.setBrightnessAsync.mockClear();
    focusMocks.focus();

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(1);
    });
  });

  it("restores brightness when the screen unmounts", async () => {
    const { unmount } = await renderWithProviders(<CardCodeScreen />);

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(1);
    });

    brightnessMocks.setBrightnessAsync.mockClear();
    unmount();

    await waitFor(() => {
      expect(brightnessMocks.setBrightnessAsync).toHaveBeenCalledWith(0.5);
    });
  });

  it("shows the manage section below the card code", async () => {
    const { getByText } = await renderWithProviders(<CardCodeScreen />);

    expect(getByText("Manage")).toBeTruthy();
    expect(getByText("Details")).toBeTruthy();
    expect(getByText("Edit card")).toBeTruthy();
    expect(getByText("Delete card")).toBeTruthy();
  });

  it("opens card details when Details is pressed", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <CardCodeScreen />,
    );

    await press(getByLabelText("Details"));

    await act(async () => {
      await waitFor(() => {
        expect(getByText("Card details")).toBeTruthy();
        expect(getByText("1234567890")).toBeTruthy();
        expect(getByText("January 1, 2020")).toBeTruthy();
      });
    });
  });

  it("opens edit card when Edit card is pressed", async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <CardCodeScreen />,
    );

    await press(getByLabelText("Edit card"));

    await act(async () => {
      await waitFor(() => {
        expect(getByLabelText("Label")).toBeTruthy();
        expect(getByText("Save")).toBeTruthy();
      });
    });
  });

  it("updates display view when saved from edit sheet", async () => {
    patchApiV1CardsByIdMock.mockImplementationOnce(async () => ({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        userId: "00000000-0000-4000-8000-000000000001",
        cardNumber: "1234567890",
        label: "",
        view: "2D" as const,
        brand: {
          id: "brand-1",
          name: "ASOS",
          logoUrl: "https://logo.clearbit.com/asos.com",
          backgroundColor: "#FFFFFF",
        },
        viewCount: 0,
        lastViewedAt: null,
        createdAt: "2020-01-01T00:00:00.000Z",
      },
      error: undefined,
    }));

    const { getByLabelText, getByText } = await renderWithProviders(
      <CardCodeScreen />,
    );

    await press(getByLabelText("Edit card"));

    await waitFor(() => {
      expect(getByLabelText("QR code")).toBeTruthy();
    });

    await press(getByLabelText("QR code"));
    await press(getByText("Save"), { flushLayout: false });

    await waitFor(() => {
      expect(patchApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
          body: { label: null, view: "2D" },
        }),
      );
    });
  });

  it("reflects saved label and view on the card code screen", async () => {
    patchApiV1CardsByIdMock.mockImplementationOnce(async () => ({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        userId: "00000000-0000-4000-8000-000000000001",
        cardNumber: "1234567890",
        label: "Personal",
        view: "2D" as const,
        brand: {
          id: "brand-1",
          name: "ASOS",
          logoUrl: "https://logo.clearbit.com/asos.com",
          backgroundColor: "#FFFFFF",
        },
        viewCount: 0,
        lastViewedAt: null,
        createdAt: "2020-01-01T00:00:00.000Z",
      },
      error: undefined,
    }));

    const { getByLabelText, getByText, queryByText } =
      await renderWithProviders(<CardCodeScreen />);

    expect(queryByText("Personal")).toBeNull();

    await press(getByLabelText("Edit card"));

    await waitFor(() => {
      expect(getByLabelText("Label").props.value).toBe("");
    });

    await press(getByLabelText("QR code"));
    await press(getByText("Save"), { flushLayout: false });

    await waitFor(() => {
      expect(getByText("ASOS")).toBeTruthy();
      expect(getByText("Personal")).toBeTruthy();
      expect(patchApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
          body: { label: null, view: "2D" },
        }),
      );
    });
  });

  it("deletes the card from the delete sheet", async () => {
    const { getByLabelText, getByTestId } = await renderWithProviders(
      <CardCodeScreen />,
    );

    await press(getByLabelText("Delete card"));

    await waitFor(() => {
      expect(getByTestId("confirm-delete-card")).toBeTruthy();
    });

    await press(getByTestId("confirm-delete-card"), { flushLayout: false });

    await waitFor(() =>
      expect(deleteApiV1CardsByIdMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "00000000-0000-4000-8000-000000000001" },
        }),
      ),
    );

    await waitFor(() =>
      expect(expoRouterMocks.dismissTo).toHaveBeenCalledWith(Routes.CARDS),
    );
  });
});
