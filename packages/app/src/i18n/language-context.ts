import { createContext, useContext } from "react";
import type { LanguagePreference, SupportedLocale } from "./i18n.constants";

export type LanguageContextValue = {
  preference: LanguagePreference;
  resolvedLocale: SupportedLocale;
  hydrated: boolean;
  setLanguagePreference: (preference: LanguagePreference) => void;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
