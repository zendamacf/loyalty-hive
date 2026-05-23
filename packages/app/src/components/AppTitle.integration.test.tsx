import { describe, expect, it } from "bun:test";

import { APP_NAME } from "@/constants/branding.constants";
import { renderWithProviders } from "../../test/render";
import { AppTitle } from "./AppTitle";

describe("[Integration] AppTitle", () => {
  it("renders LoyaltyHive branding", async () => {
    const { getByText, getByRole } = await renderWithProviders(<AppTitle />);

    expect(getByText(APP_NAME)).toBeTruthy();
    expect(getByRole("header")).toBeTruthy();
  });

  it("exposes the full app name to assistive technologies", async () => {
    const { getByLabelText } = await renderWithProviders(<AppTitle />);

    expect(getByLabelText(APP_NAME)).toBeTruthy();
  });

  it("applies align prop to title text", async () => {
    const { getByRole } = await renderWithProviders(<AppTitle align="left" />);

    const title = getByRole("header");
    const styleProp = title.props.style;
    const styles = Array.isArray(styleProp) ? styleProp : [styleProp];

    expect(
      styles.some(
        (s) =>
          typeof s === "object" &&
          s !== null &&
          "textAlign" in s &&
          s.textAlign === "left",
      ),
    ).toBe(true);
  });
});
