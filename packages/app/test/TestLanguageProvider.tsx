import type { ReactNode } from "react";
import { LanguageContext } from "@/i18n/language-context";

export const TestLanguageProvider = ({ children }: { children: ReactNode }) => (
  <LanguageContext.Provider
    value={{
      preference: "en",
      resolvedLocale: "en",
      hydrated: true,
      setLanguagePreference: () => {},
    }}
  >
    {children}
  </LanguageContext.Provider>
);
