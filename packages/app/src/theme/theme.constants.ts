export const THEME_STORAGE_KEY = "@loyalty-hive/theme";

export type ThemeMode = "light" | "dark";

export const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark";
