import { createContext } from "react";
import type { ThemeMode } from "./theme.constants";
import type { Theme } from "./types";

export type ThemeContextValue = {
  themeMode: ThemeMode;
  theme: Theme;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
