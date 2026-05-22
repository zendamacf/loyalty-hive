import { describe, expect, it } from "bun:test";

import {
  resolveColorAppearance,
  THEME_PALETTE,
} from "./theme.constants";

describe("theme.constants", () => {
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
});
