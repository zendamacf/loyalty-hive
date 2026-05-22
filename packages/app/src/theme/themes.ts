import type { ColorSchemeName } from "react-native";

import type { ThemeMode } from "./theme.constants";
import {
  type ColorAppearance,
  resolveColorAppearance,
  type Theme,
} from "./types";

const branding = {
  primary: "#FFC43D",
} as const;

export const lightTheme: Theme = {
  appearance: "light",
  ...branding,
  background: "#FFFFFF",
  surface: "#F8FAFC",
  cardFallback: "#E8EEF5",
  textPrimary: "#0F172A",
  menuShadow: "#CBD5E1",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  error: "#EF4444",
  success: "#22C55E",
  touchHighlight: "rgba(15, 23, 42, 0.1)",
};

export const darkTheme: Theme = {
  appearance: "dark",
  ...branding,
  background: "#0D1B2A",
  surface: "#1E293B",
  cardFallback: "#243B56",
  textPrimary: "#F1F5F9",
  menuShadow: "#020617",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  error: "#EF4444",
  success: "#22C55E",
  touchHighlight: "rgba(255, 255, 255, 0.14)",
};

const themes: Record<ColorAppearance, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const resolveTheme = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): Theme => themes[resolveColorAppearance(mode, systemScheme)];
