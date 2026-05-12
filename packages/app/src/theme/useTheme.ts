import { useColorScheme } from "react-native";
import { colors } from "./theme";

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    isDark,
    colors: {
      background: isDark ? colors.backgroundDark : colors.backgroundLight,
      surface: isDark ? colors.surfaceDark : colors.surfaceLight,
      textPrimary: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
      textSecondary: colors.textSecondary,
      border: colors.border,
      primary: colors.primary,
      error: colors.error,
      success: colors.success,
    },
  };
};
