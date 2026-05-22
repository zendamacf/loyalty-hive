import { useColorScheme } from "react-native";

import { DEFAULT_THEME_MODE } from "./theme.constants";
import { resolveTheme } from "./themes";
import { useThemeContext } from "./useThemeContext";

export const useTheme = () => {
  const context = useThemeContext();
  const scheme = useColorScheme();
  const themeMode = context?.themeMode ?? DEFAULT_THEME_MODE;

  return {
    themeMode,
    theme: context?.theme ?? resolveTheme(themeMode, scheme),
    setThemeMode: context?.setThemeMode ?? (() => {}),
  };
};
