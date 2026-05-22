import { MoonIcon, SunIcon } from "lucide-react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { I18nNamespace } from "@/i18n/i18n.constants";
import type { ThemeMode } from "@/theme/theme.constants";
import { useTheme } from "@/theme/useTheme";
import { Select } from "./Select";

export const ThemePicker = () => {
  const { t } = useTranslation([I18nNamespace.Common, I18nNamespace.Settings]);
  const { isDark, setThemeMode } = useTheme();

  const value: ThemeMode = isDark ? "dark" : "light";

  const options = useMemo(
    () => [
      {
        value: "light" as const,
        label: t("light", { ns: I18nNamespace.Common }),
        icon: SunIcon,
      },
      {
        value: "dark" as const,
        label: t("dark", { ns: I18nNamespace.Common }),
        icon: MoonIcon,
      },
    ],
    [t],
  );

  return (
    <Select
      value={value}
      onValueChange={setThemeMode}
      options={options}
      accessibilityLabel={t("theme", { ns: I18nNamespace.Settings })}
    />
  );
};
