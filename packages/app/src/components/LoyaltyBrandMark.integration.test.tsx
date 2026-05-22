import { describe, expect, it } from "bun:test";
import { Image } from "react-native";
import { brandMark } from "@/theme/theme";
import { renderWithTheme } from "../../test/render";
import { LoyaltyBrandMark } from "./LoyaltyBrandMark";

describe("[Integration] LoyaltyBrandMark", () => {
  it("renders provided logo", async () => {
    const { UNSAFE_getByType } = await renderWithTheme(
      <LoyaltyBrandMark
        brand="Test Brand"
        height={48}
        logo="https://example.com/logo.png"
      />,
    );

    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({ uri: "https://example.com/logo.png" });
  });

  it("renders brand name when no logo is provided", async () => {
    const { getByText } = await renderWithTheme(
      <LoyaltyBrandMark brand="Test Brand" height={48} />,
    );

    expect(getByText("Test Brand")).toBeTruthy();
  });

  it("animates height when animateHeight is enabled", async () => {
    const { rerender } = await renderWithTheme(
      <LoyaltyBrandMark
        animateHeight
        brand="Test Brand"
        height={brandMark.heightDetailBarcode}
        logo="https://example.com/logo.png"
      />,
    );

    rerender(
      <LoyaltyBrandMark
        animateHeight
        brand="Test Brand"
        height={brandMark.heightDetailQr}
        logo="https://example.com/logo.png"
      />,
    );
  });
});
