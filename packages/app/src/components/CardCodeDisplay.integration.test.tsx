import { describe, expect, it } from "bun:test";
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

  it("always renders the brand strip without logo or name when unbranded", async () => {
    const { getByTestId } = await renderWithProviders(
      <CardCodeDisplay
        cardNumber="1234567890"
        view="1D"
        borderColor="#E2E8F0"
      />,
    );

    const brandStrip = getByTestId("brand-strip");
    expect(brandStrip).toBeTruthy();
    expect(brandStrip.queryAll((node) => node.type === "Image")).toHaveLength(
      0,
    );
  });

  it("renders logo and name in the brand strip when provided", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <CardCodeDisplay
        cardNumber="1234567890"
        view="1D"
        borderColor="#E2E8F0"
        brand="ASOS"
        logoUrl="https://logo.clearbit.com/asos.com"
        backgroundColor="#FFFFFF"
      />,
    );

    const brandStrip = getByTestId("brand-strip");
    expect(brandStrip).toBeTruthy();
    expect(getByText("ASOS")).toBeTruthy();
    const [img] = brandStrip.queryAll((node) => node.type === "Image");
    expect(img).toBeTruthy();
    expect(img.props.source).toEqual({
      uri: "https://logo.clearbit.com/asos.com",
    });
  });
});
