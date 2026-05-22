import { describe, expect, it } from "bun:test";
import { renderWithTheme } from "../../test/render";

const { CardCodeDisplay } = await import("./CardCodeDisplay");

describe("CardCodeDisplay", () => {
  it("renders barcode and QR layers", async () => {
    const { getByTestId } = await renderWithTheme(
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
    const { getByTestId, rerender } = await renderWithTheme(
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
});
