import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { I18nNamespace } from "@/i18n/i18n.constants";
import type { ThemeMode } from "@/theme/theme.constants";
import { THEME_PICKER_OPTIONS } from "@/theme/theme-registry";
import { useTheme } from "@/theme/useTheme";
import { Select, type SelectOption } from "./Select";

export const ThemePicker = () => {
  const { t } = useTranslation([I18nNamespace.Common, I18nNamespace.Settings]);
  const { themeMode, setThemeMode } = useTheme();

  const options = useMemo(
    (): readonly SelectOption<ThemeMode>[] =>
      THEME_PICKER_OPTIONS.map((option) => ({
        value: option.mode,
        label: t(option.labelKey),
        icon: option.icon,
      })),
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
