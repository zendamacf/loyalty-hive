import { describe, expect, it } from "bun:test";
import { Image } from "react-native";
import { renderWithTheme } from "../../test/render";
import { LoyaltyBrandMark } from "./LoyaltyBrandMark";

describe("LoyaltyBrandMark", () => {
  it("renders provided logo", () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LoyaltyBrandMark
        brand="Test Brand"
        height={48}
        logo="https://example.com/logo.png"
      />,
    );

    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({ uri: "https://example.com/logo.png" });
  });

  it("renders brand name when no logo is provided", () => {
    const { getByText } = renderWithTheme(
      <LoyaltyBrandMark brand="Test Brand" height={48} />,
    );

    expect(getByText("Test Brand")).toBeTruthy();
  });

  it("animates height when animateHeight is enabled", () => {
    const { rerender } = renderWithTheme(
      <LoyaltyBrandMark
        animateHeight
        brand="Test Brand"
        height={200}
        logo="https://example.com/logo.png"
      />,
    );

    rerender(
      <LoyaltyBrandMark
        animateHeight
        brand="Test Brand"
        height={100}
        logo="https://example.com/logo.png"
      />,
    );
  });
});
