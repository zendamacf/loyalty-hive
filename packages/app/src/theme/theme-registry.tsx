import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";

import type { SelectOptionIconProps } from "@/components/Select";
import { SystemThemeColorCircle } from "@/components/SystemThemeColorCircle";
import { ThemeColorCircle } from "@/components/ThemeColorCircle";
import type { ThemeMode } from "./theme.constants";
import { darkTheme, lightTheme, purpleTheme } from "./themes";

export type ThemePickerOptionDef = {
  mode: ThemeMode;
  labelKey: "system" | "light" | "dark" | "purple";
  icon?: LucideIcon;
  renderIcon?: (props: SelectOptionIconProps) => ReactNode;
};

export const THEME_PICKER_OPTIONS: readonly ThemePickerOptionDef[] = [
  {
    mode: "system",
    labelKey: "system",
    renderIcon: ({ size }) => (
      <SystemThemeColorCircle size={size} testID="system-theme-swatch" />
    ),
  },
  {
    mode: "light",
    labelKey: "light",
    renderIcon: ({ size }) => (
      <ThemeColorCircle
        theme={lightTheme}
        size={size}
        testID="light-theme-swatch"
      />
    ),
  },
  {
    mode: "dark",
    labelKey: "dark",
    renderIcon: ({ size }) => (
      <ThemeColorCircle
        theme={darkTheme}
        size={size}
        testID="dark-theme-swatch"
      />
    ),
  },
  {
    mode: "purple",
    labelKey: "purple",
    renderIcon: ({ size }) => (
      <ThemeColorCircle
        theme={purpleTheme}
        size={size}
        testID="purple-theme-swatch"
      />
    ),
  },
];
