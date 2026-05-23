import { describe, expect, it } from "bun:test";

import {
  darkTheme,
  lightTheme,
  purpleTheme,
  resolveTheme,
  themesByMode,
} from "./themes";

describe("[Unit] themes", () => {
  it("themesByMode includes light, dark, and purple", () => {
    expect(themesByMode.light).toBe(lightTheme);
    expect(themesByMode.dark).toBe(darkTheme);
    expect(themesByMode.purple).toBe(purpleTheme);
  });

  it("resolveTheme follows system scheme for system mode", () => {
    expect(resolveTheme("system", "dark")).toBe(darkTheme);
    expect(resolveTheme("system", "light")).toBe(lightTheme);
    expect(resolveTheme("system", null)).toBe(lightTheme);
    expect(resolveTheme(null, "dark")).toBe(darkTheme);
  });

  it("resolveTheme returns explicit themes regardless of system scheme", () => {
    expect(resolveTheme("light", "dark")).toBe(lightTheme);
    expect(resolveTheme("dark", "light")).toBe(darkTheme);
    expect(resolveTheme("purple", "light")).toBe(purpleTheme);
  });
});
