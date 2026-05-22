export const THEME_STORAGE_KEY = "@loyalty-hive/theme";

export type ThemeMode = "system" | "light" | "dark";

export const DEFAULT_THEME_MODE: ThemeMode = "system";

export const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";
