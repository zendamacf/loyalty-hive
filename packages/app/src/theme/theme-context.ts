import { createContext } from "react";
import { colors } from "./theme";
import type { ColorAppearance, ThemeMode } from "./theme.constants";

export type ThemeColors = {
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

export type ThemeContextValue = {
  themeMode: ThemeMode;
  colorAppearance: ColorAppearance;
  colors: ThemeColors;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

export const themeColorsForAppearance = (
  appearance: ColorAppearance,
): ThemeColors => ({
  background:
    appearance === "dark" ? colors.backgroundDark : colors.backgroundLight,
  surface: appearance === "dark" ? colors.surfaceDark : colors.surfaceLight,
  cardFallback:
    appearance === "dark" ? colors.cardFallbackDark : colors.cardFallbackLight,
  textPrimary:
    appearance === "dark" ? colors.textPrimaryDark : colors.textPrimaryLight,
  textSecondary: colors.textSecondary,
  border: colors.border,
  primary: colors.primary,
  error: colors.error,
  success: colors.success,
  menuShadow:
    appearance === "dark" ? colors.menuShadowDark : colors.menuShadowLight,
});

export const ThemeContext = createContext<ThemeContextValue | null>(null);
