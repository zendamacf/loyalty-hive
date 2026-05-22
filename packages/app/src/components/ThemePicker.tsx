import { ContrastIcon, MoonIcon, SunIcon } from "lucide-react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { I18nNamespace } from "@/i18n/i18n.constants";
import type { ThemeMode } from "@/theme/theme.constants";
import { useTheme } from "@/theme/useTheme";
import { Select, type SelectOption } from "./Select";

export const ThemePicker = () => {
  const { t } = useTranslation([I18nNamespace.Common, I18nNamespace.Settings]);
  const { themeMode, setThemeMode } = useTheme();

  const options = useMemo(
    (): readonly SelectOption<ThemeMode>[] => [
      {
        value: "system",
        label: t("system"),
        icon: ContrastIcon,
      },
      {
        value: "light",
        label: t("light"),
        icon: SunIcon,
      },
      {
        value: "dark",
        label: t("dark"),
        icon: MoonIcon,
      },
    ],
    [t],
  );

  return (
    <Select
      value={themeMode}
      onValueChange={setThemeMode}
      options={options}
      accessibilityLabel={t("theme", { ns: I18nNamespace.Settings })}
    />
  );
};
