import type { ExplicitThemeMode } from "./theme.constants";

export type Theme = {
  mode: ExplicitThemeMode;
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
