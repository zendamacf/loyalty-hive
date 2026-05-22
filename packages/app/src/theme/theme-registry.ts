import {
  ContrastIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react-native";

import type { ThemeMode } from "./theme.constants";

export type ThemePickerOptionDef = {
  mode: ThemeMode;
  labelKey: "system" | "light" | "dark" | "purple";
  icon: LucideIcon;
};

export const THEME_PICKER_OPTIONS: readonly ThemePickerOptionDef[] = [
  { mode: "system", labelKey: "system", icon: ContrastIcon },
  { mode: "light", labelKey: "light", icon: SunIcon },
  { mode: "dark", labelKey: "dark", icon: MoonIcon },
  { mode: "purple", labelKey: "purple", icon: PaletteIcon },
];
