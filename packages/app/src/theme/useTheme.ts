import { useColorScheme } from "react-native";
import { useThemeContext } from "./ThemeProvider";
import { colors } from "./theme";

const fallbackColors = (isDark: boolean) => ({
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

export const useTheme = () => {
  const context = useThemeContext();
  const scheme = useColorScheme();
  const isDark = context?.isDark ?? scheme === "dark";

  return {
    isDark,
    colors: context?.colors ?? fallbackColors(isDark),
    setThemeMode: context?.setThemeMode ?? (() => {}),
    toggleTheme: context?.toggleTheme ?? (() => {}),
  };
};
