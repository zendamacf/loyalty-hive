import { describe, expect, it } from "bun:test";
import { renderWithTheme } from "../../test/render";
import { AppTitle } from "./AppTitle";

describe("AppTitle", () => {
  it("renders LoyaltyHive branding", () => {
    const { getByText, getByRole } = renderWithTheme(<AppTitle />);

    expect(getByText("LoyaltyHive")).toBeTruthy();
    expect(getByRole("header")).toBeTruthy();
  });
});
