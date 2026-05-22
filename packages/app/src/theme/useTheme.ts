import { useColorScheme } from "react-native";
import type { ColorAppearance } from "./theme.constants";
import { themeColorsForAppearance } from "./theme-context";
import { useThemeContext } from "./useThemeContext";

const fallbackAppearance = (
  scheme: ReturnType<typeof useColorScheme>,
): ColorAppearance => (scheme === "dark" ? "dark" : "light");

export const useTheme = () => {
  const context = useThemeContext();
  const scheme = useColorScheme();
  const colorAppearance =
    context?.colorAppearance ?? fallbackAppearance(scheme);

  return {
    themeMode: context?.themeMode ?? "system",
    colorAppearance,
    colors: context?.colors ?? themeColorsForAppearance(colorAppearance),
    setThemeMode: context?.setThemeMode ?? (() => {}),
  };
};
