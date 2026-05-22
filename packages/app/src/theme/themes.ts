import type { ColorSchemeName } from "react-native";

import { brandColors } from "./brand";
import type { ExplicitThemeMode, ThemeMode } from "./theme.constants";
import type { Theme } from "./types";

const shared = {
  textSecondary: "#64748B",
  border: "#E2E8F0",
  error: "#EF4444",
  success: "#22C55E",
  primary: brandColors.primary,
} as const;

export const lightTheme: Theme = {
  mode: "light",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  cardFallback: "#E8EEF5",
  textPrimary: "#0F172A",
  menuShadow: "#CBD5E1",
  touchHighlight: "rgba(15, 23, 42, 0.1)",
  ...shared,
};

export const darkTheme: Theme = {
  mode: "dark",
  background: "#0D1B2A",
  surface: "#1E293B",
  cardFallback: "#243B56",
  textPrimary: "#F1F5F9",
  menuShadow: "#020617",
  touchHighlight: "rgba(255, 255, 255, 0.14)",
  ...shared,
};

export const purpleTheme: Theme = {
  mode: "purple",
  background: "#1A0A2E",
  surface: "#2D1B4E",
  cardFallback: "#3D2963",
  textPrimary: "#F3E8FF",
  textSecondary: "#C4B5FD",
  border: "#5B21B6",
  menuShadow: "#0F0518",
  touchHighlight: "rgba(255, 255, 255, 0.14)",
  primary: brandColors.primary,
  error: "#EF4444",
  success: "#22C55E",
};

export const themesByMode: Record<ExplicitThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  purple: purpleTheme,
};

/** Foreground colors for {@link getReadableTextColor} on arbitrary backgrounds. */
export const readableForeground = {
  onLightBackground: lightTheme.textPrimary,
  onDarkBackground: darkTheme.textPrimary,
} as const;

export const resolveTheme = (
  mode: ThemeMode | null,
  systemScheme: ColorSchemeName | null,
): Theme => {
  if (mode === null || mode === "system") {
    return systemScheme === "dark" ? darkTheme : lightTheme;
  }
  return themesByMode[mode];
};
