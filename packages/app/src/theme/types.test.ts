import { describe, expect, it } from "bun:test";

import { darkTheme, lightTheme } from "./themes";
import {
  appearanceFromColorScheme,
  isDarkTheme,
  resolveColorAppearance,
  THEME_PALETTE,
  touchHighlightColor,
} from "./types";

describe("theme types", () => {
  it("maps explicit theme modes to palettes via THEME_PALETTE", () => {
    expect(THEME_PALETTE.light).toBe("light");
    expect(THEME_PALETTE.dark).toBe("dark");
  });

  it("resolveColorAppearance follows system scheme for system mode", () => {
    expect(resolveColorAppearance("system", "dark")).toBe("dark");
    expect(resolveColorAppearance("system", "light")).toBe("light");
    expect(resolveColorAppearance("system", null)).toBe("light");
  });

  it("resolveColorAppearance uses THEME_PALETTE for explicit modes", () => {
    expect(resolveColorAppearance("light", "dark")).toBe("light");
    expect(resolveColorAppearance("dark", "light")).toBe("dark");
  });

  it("appearanceFromColorScheme maps device scheme to appearance", () => {
    expect(appearanceFromColorScheme("dark")).toBe("dark");
    expect(appearanceFromColorScheme("light")).toBe("light");
    expect(appearanceFromColorScheme(null)).toBe("light");
  });

  it("isDarkTheme and touchHighlightColor use theme.appearance", () => {
    expect(isDarkTheme(lightTheme)).toBe(false);
    expect(isDarkTheme(darkTheme)).toBe(true);
    expect(touchHighlightColor(lightTheme)).toBe("rgba(15, 23, 42, 0.1)");
    expect(touchHighlightColor(darkTheme)).toBe("rgba(255, 255, 255, 0.14)");
  });
});
