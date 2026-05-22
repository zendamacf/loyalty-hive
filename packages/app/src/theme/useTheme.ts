import { useColorScheme } from "react-native";
import { colors } from "./theme";
import { useThemeContext } from "./useThemeContext";

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
    themeMode: context?.themeMode ?? "system",
    colors: context?.colors ?? fallbackColors(isDark),
    setThemeMode: context?.setThemeMode ?? (() => {}),
    toggleTheme: context?.toggleTheme ?? (() => {}),
  };
};
