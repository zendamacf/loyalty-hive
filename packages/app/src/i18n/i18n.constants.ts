export const LANGUAGE_STORAGE_KEY = "@loyalty-hive/language";

export enum I18nNamespace {
  Common = "common",
  Auth = "auth",
  Cards = "cards",
  Brands = "brands",
  Scan = "scan",
  Settings = "settings",
}

/** All namespace values — for tests and i18next `ns` config. */
export const I18N_NAMESPACES = Object.values(I18nNamespace);

export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** User-selected language (Settings picker). */
export type LanguagePreference = SupportedLocale;

export const isSupportedLocale = (value: string): value is SupportedLocale =>
  value === "en" || value === "es";

export const isLanguagePreference = (
  value: string | null,
): value is LanguagePreference => isSupportedLocale(value ?? "");
