import { describe, expect, it } from "bun:test";
import { Image } from "react-native";
import { renderWithProviders } from "../../test/render";

const { CardCodeDisplay } = await import("./CardCodeDisplay");

describe("[Integration] CardCodeDisplay", () => {
  it("renders barcode and QR layers", async () => {
    const { getByTestId } = await renderWithProviders(
      <CardCodeDisplay
        cardNumber="1234567890"
        view="1D"
        borderColor="#E2E8F0"
      />,
    );

    expect(getByTestId("barcode")).toBeTruthy();
    expect(getByTestId("qrcode")).toBeTruthy();
  });

  it("animates when view changes", async () => {
    const { getByTestId, rerender } = await renderWithProviders(
      <CardCodeDisplay
        cardNumber="1234567890"
        view="1D"
        borderColor="#E2E8F0"
      />,
    );

    expect(getByTestId("barcode")).toBeTruthy();

    rerender(
      <CardCodeDisplay
        cardNumber="1234567890"
        view="2D"
        borderColor="#E2E8F0"
      />,
    );

    expect(getByTestId("qrcode")).toBeTruthy();
  });

  it("renders a brand strip with logo and name", async () => {
    const { getByTestId, getByText, UNSAFE_getByType } =
      await renderWithProviders(
        <CardCodeDisplay
          cardNumber="1234567890"
          view="1D"
          borderColor="#E2E8F0"
          brand="ASOS"
          logoUrl="https://logo.clearbit.com/asos.com"
          backgroundColor="#FFFFFF"
        />,
      );

    expect(getByTestId("brand-strip")).toBeTruthy();
    expect(getByText("ASOS")).toBeTruthy();
    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({
      uri: "https://logo.clearbit.com/asos.com",
    });
  });
});
