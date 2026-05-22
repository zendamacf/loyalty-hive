import { createContext } from "react";
import { colors } from "./theme";
import type { ThemeMode } from "./theme.constants";

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
  isDark: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

export const themeColorsForMode = (isDark: boolean): ThemeColors => ({
  background: isDark ? colors.backgroundDark : colors.backgroundLight,
  surface: isDark ? colors.surfaceDark : colors.surfaceLight,
  cardFallback: isDark ? colors.cardFallbackDark : colors.cardFallbackLight,
  textPrimary: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
  textSecondary: colors.textSecondary,
  border: colors.border,
  primary: colors.primary,
  error: colors.error,
  success: colors.success,
  menuShadow: isDark ? colors.menuShadowDark : colors.menuShadowLight,
});

export const ThemeContext = createContext<ThemeContextValue | null>(null);
