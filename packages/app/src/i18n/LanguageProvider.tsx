import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  type LanguagePreference,
} from "./i18n.constants";
import i18n from "./index";
import { LanguageContext } from "./language-context";
import { localeFromDeviceCode } from "./resolveLocale";

const readStoredPreference = async (
  deviceLanguageCode: string | null,
): Promise<LanguagePreference> => {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguagePreference(stored)) {
    return stored;
  }
  // Migrate legacy "system" or missing value to a concrete locale.
  const fromDevice = localeFromDeviceCode(deviceLanguageCode);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, fromDevice);
  return fromDevice;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreference] = useState<LanguagePreference>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const Localization = await import("expo-localization");
        const deviceLanguageCode =
          Localization.getLocales()[0]?.languageCode ?? null;
        const resolved = await readStoredPreference(deviceLanguageCode);
        if (!cancelled) {
          setPreference(resolved);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void i18n.changeLanguage(preference);
  }, [hydrated, preference]);

  const setLanguagePreference = useCallback((next: LanguagePreference) => {
    setPreference(next);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedLocale: preference,
      hydrated,
      setLanguagePreference,
    }),
    [preference, hydrated, setLanguagePreference],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
