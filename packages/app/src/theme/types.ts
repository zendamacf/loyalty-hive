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
  touchHighlight: string;
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
  systemScheme: ColorSchemeName | null,
): ColorAppearance => {
  if (mode === null || mode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return THEME_PALETTE[mode];
};
