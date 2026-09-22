import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  I18nNamespace,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/i18n.constants";
import { useLanguage } from "@/i18n/useLanguage";

import { AnalyticsEvents, trackAppEvent } from "@/lib/analytics";
import { Select } from "./Select";

const PREFERENCE_LABEL_KEYS: Record<
  SupportedLocale,
  "languageEnglish" | "languageSpanish"
> = {
  en: "languageEnglish",
  es: "languageSpanish",
};

export const LanguagePicker = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { preference, setLanguagePreference } = useLanguage();

  const options = useMemo(
    () =>
      SUPPORTED_LOCALES.map((locale) => ({
        value: locale,
        label: t(PREFERENCE_LABEL_KEYS[locale]),
      })),
    [t],
  );

  const handleLanguageChange = (nextLanguage: SupportedLocale) => {
    setLanguagePreference(nextLanguage);
    void trackAppEvent(AnalyticsEvents.SETTINGS_LANGUAGE_CHANGE, {
      language: nextLanguage,
    });
  };

  return (
    <Select
      value={preference}
      onValueChange={handleLanguageChange}
      options={options}
      accessibilityLabel={t("language")}
    />
  );
};
