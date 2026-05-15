import { describe, expect, it } from "bun:test";

import { APP_NAME } from "@/constants/branding.constants";
import { renderWithTheme } from "../../test/render";
import { AppTitle } from "./AppTitle";

describe("AppTitle", () => {
  it("renders LoyaltyHive branding", () => {
    const { getByText, getByRole } = renderWithTheme(<AppTitle />);

    expect(getByText(APP_NAME)).toBeTruthy();
    expect(getByRole("header")).toBeTruthy();
  });

  it("exposes the full app name to assistive technologies", () => {
    const { getByLabelText } = renderWithTheme(<AppTitle />);

    expect(getByLabelText(APP_NAME)).toBeTruthy();
  });

  it("applies align prop to title text", () => {
    const { getByRole } = renderWithTheme(<AppTitle align="left" />);

    const title = getByRole("header");
    const styleProp = title.props.style;
    const styles = Array.isArray(styleProp) ? styleProp : [styleProp];

    expect(
      styles.some(
        (s) =>
          typeof s === "object" && s !== null && "textAlign" in s && s.textAlign === "left",
      ),
    ).toBe(true);
  });
});
