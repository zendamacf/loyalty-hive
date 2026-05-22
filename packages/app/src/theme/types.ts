import type { ColorSchemeName } from "react-native";

import type { ThemeMode } from "./theme.constants";

/** Resolved palette bucket (extensible as {@link ThemeMode} grows). */
export type ColorAppearance = "light" | "dark";

export type Theme = {
  appearance: ColorAppearance;
  background: string;
  surface: string;
  cardFallback: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
  success: string;
  menuShadow: string;
};

/** Maps each explicit theme preference to the palette applied at runtime. */
export const THEME_PALETTE: Record<
  Exclude<ThemeMode, "system">,
  ColorAppearance
> = {
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

export const appearanceFromColorScheme = (
  scheme: ColorSchemeName,
): ColorAppearance => (scheme === "dark" ? "dark" : "light");

export const isDarkTheme = (theme: Theme): boolean =>
  theme.appearance === "dark";

/** Pressed-state overlay for brand tiles on the cards list. */
export const touchHighlightColor = (theme: Theme): string =>
  isDarkTheme(theme) ? "rgba(255, 255, 255, 0.14)" : "rgba(15, 23, 42, 0.1)";
