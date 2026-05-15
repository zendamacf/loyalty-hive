export const LANGUAGE_STORAGE_KEY = "@loyalty-hive/language";

export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** User-selected language (Settings picker). */
export type LanguagePreference = SupportedLocale;

export const isSupportedLocale = (value: string): value is SupportedLocale =>
  value === "en" || value === "es";

export const isLanguagePreference = (
  value: string | null,
): value is LanguagePreference => isSupportedLocale(value ?? "");
