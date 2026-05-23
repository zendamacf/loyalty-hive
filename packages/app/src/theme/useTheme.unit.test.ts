import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react-native";

import { DEFAULT_THEME_MODE } from "./theme.constants";
import { lightTheme } from "./themes";
import { useTheme } from "./useTheme";

describe("[Unit] useTheme", () => {
  it("uses resolveTheme fallback when ThemeContext is null", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe(DEFAULT_THEME_MODE);
    expect(result.current.theme).toEqual(lightTheme);
  });

  it("noop setThemeMode when ThemeContext is null", () => {
    const { result } = renderHook(() => useTheme());

    expect(() => result.current.setThemeMode("dark")).not.toThrow();
    expect(result.current.themeMode).toBe(DEFAULT_THEME_MODE);
  });
});
