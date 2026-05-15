import { describe, expect, it } from "bun:test";
import { renderWithTheme } from "../../test/render";
import { AppTitle } from "./AppTitle";

describe("AppTitle", () => {
  it("renders LoyaltyHive branding", () => {
    const { getByText, getByRole } = renderWithTheme(<AppTitle />);

    expect(getByText("LoyaltyHive")).toBeTruthy();
    expect(getByRole("header")).toBeTruthy();
  });

  it("applies align prop to title text", () => {
    const { getByRole } = renderWithTheme(<AppTitle align="left" />);

    const title = getByRole("header");
    const styles = Array.isArray(title.props.style)
      ? title.props.style
      : [title.props.style];

    expect(styles.some((s) => s?.textAlign === "left")).toBe(true);
  });
});
