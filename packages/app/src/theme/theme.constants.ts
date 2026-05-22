import type { ColorSchemeName } from "react-native";

export const THEME_STORAGE_KEY = "@loyalty-hive/theme";

export type ThemeMode = "system" | "light" | "dark";

/** Resolved palette bucket used for color tokens (extensible as ThemeMode grows). */
export type ColorAppearance = "light" | "dark";

export const DEFAULT_THEME_MODE: ThemeMode = "system";

export const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";

/** Maps each explicit theme preference to the palette applied at runtime. */
export const THEME_PALETTE: Record<Exclude<ThemeMode, "system">, ColorAppearance> =
  {
    light: "light",
    dark: "dark",
  };

export const resolveColorAppearance = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): ColorAppearance => {
  if (mode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return THEME_PALETTE[mode];
};
