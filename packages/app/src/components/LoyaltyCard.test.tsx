import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react-native";
import { LoyaltyCard } from "./LoyaltyCard";

describe("LoyaltyCard", () => {
  it("renders provided brand name", () => {
    const { getByText } = render(
      <LoyaltyCard brand="Test Brand" logo="https://example.com/logo.png" />,
    );

    expect(getByText("Test Brand")).toBeTruthy();
  });
});
