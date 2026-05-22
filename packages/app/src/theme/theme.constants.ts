import type { ColorSchemeName } from "react-native";

export const THEME_STORAGE_KEY = "@loyalty-hive/theme";

export type ThemeMode = "system" | "light" | "dark";

export const DEFAULT_THEME_MODE: ThemeMode = "system";

export const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";

export const resolveIsDark = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): boolean => {
  if (mode === "dark") {
    return true;
  }
  if (mode === "light") {
    return false;
  }
  return systemScheme === "dark";
};
