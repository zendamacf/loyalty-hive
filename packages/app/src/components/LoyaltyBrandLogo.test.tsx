import { render } from "@testing-library/react-native";
import { describe, expect, it } from "bun:test";
import { LoyaltyBrandLogo } from "./LoyaltyBrandLogo";

describe("LoyaltyBrandLogo", () => {
  it("renders provided logo", () => {
    const { getByImage } = render(
      <LoyaltyBrandLogo
        brand="Test Brand"
        logo="https://example.com/logo.png"
      />,
    );
  });

  it("renders placeholder if no logo is provided", () => {
    const { getByText } = render(<LoyaltyBrandLogo brand="Test Brand" />);

    expect(getByText("Test Brand")).toBeTruthy();
  });
});
