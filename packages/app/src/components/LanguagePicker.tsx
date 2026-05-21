import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  I18nNamespace,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/i18n.constants";
import { useLanguage } from "@/i18n/useLanguage";
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

  return (
    <Select
      value={preference}
      onValueChange={setLanguagePreference}
      options={options}
      accessibilityLabel={t("language")}
    />
  );
};
