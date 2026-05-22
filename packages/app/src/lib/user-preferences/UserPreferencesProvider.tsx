import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import i18n from "@/i18n";
import {
  isLanguagePreference,
  LANGUAGE_STORAGE_KEY,
  type LanguagePreference,
} from "@/i18n/i18n.constants";
import { LanguageContext } from "@/i18n/language-context";
import { localeFromDeviceCode } from "@/i18n/resolveLocale";
import {
  CARD_SORT_STORAGE_KEY,
  type CardListSort,
  DEFAULT_CARD_SORT,
  isCardListSort,
} from "@/lib/card-sort/card-sort.constants";

import { CardSortContext } from "@/lib/card-sort/card-sort-context";
import {
  DEFAULT_THEME_MODE,
  isThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/theme/theme.constants";
import { ThemeContext } from "@/theme/theme-context";
import { resolveTheme } from "@/theme/themes";

const readStoredLanguage = async (
  deviceLanguageCode: string | null,
): Promise<LanguagePreference> => {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguagePreference(stored)) {
    return stored;
  }
  const fromDevice = localeFromDeviceCode(deviceLanguageCode);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, fromDevice);
  return fromDevice;
};

export const UserPreferencesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] =
    useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [themeHydrated, setThemeHydrated] = useState(false);
  const [languagePreference, setLanguagePreference] =
    useState<LanguagePreference>("en");
  const [languageHydrated, setLanguageHydrated] = useState(false);
  const [cardSort, setCardSortState] =
    useState<CardListSort>(DEFAULT_CARD_SORT);
  const [cardSortHydrated, setCardSortHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const Localization = await import("expo-localization");
        const deviceLanguageCode =
          Localization.getLocales()[0]?.languageCode ?? null;

        const [storedTheme, storedLanguage, storedCardSort] = await Promise.all(
          [
            AsyncStorage.getItem(THEME_STORAGE_KEY),
            readStoredLanguage(deviceLanguageCode),
            AsyncStorage.getItem(CARD_SORT_STORAGE_KEY),
          ],
        );

        if (cancelled) {
          return;
        }

        if (isThemeMode(storedTheme)) {
          setThemePreference(storedTheme);
        } else if (storedTheme !== null) {
          setThemePreference(DEFAULT_THEME_MODE);
          void AsyncStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_MODE);
        }
        setLanguagePreference(storedLanguage);
        if (isCardListSort(storedCardSort)) {
          setCardSortState(storedCardSort);
        }
      } finally {
        if (!cancelled) {
          setThemeHydrated(true);
          setLanguageHydrated(true);
          setCardSortHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!languageHydrated) {
      return;
    }
    void i18n.changeLanguage(languagePreference);
  }, [languageHydrated, languagePreference]);

  const theme = resolveTheme(themePreference, systemScheme);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemePreference(mode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const setLanguagePreferencePersisted = useCallback(
    (next: LanguagePreference) => {
      setLanguagePreference(next);
      void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    },
    [],
  );

  const setCardSort = useCallback((next: CardListSort) => {
    setCardSortState(next);
    void AsyncStorage.setItem(CARD_SORT_STORAGE_KEY, next);
  }, []);

  const themeValue = useMemo(
    () => ({
      themeMode: themePreference,
      theme,
      hydrated: themeHydrated,
      setThemeMode,
    }),
    [setThemeMode, theme, themeHydrated, themePreference],
  );

  const languageValue = useMemo(
    () => ({
      preference: languagePreference,
      resolvedLocale: languagePreference,
      hydrated: languageHydrated,
      setLanguagePreference: setLanguagePreferencePersisted,
    }),
    [languageHydrated, languagePreference, setLanguagePreferencePersisted],
  );

  const cardSortValue = useMemo(
    () => ({
      sort: cardSort,
      hydrated: cardSortHydrated,
      setSort: setCardSort,
    }),
    [cardSort, cardSortHydrated, setCardSort],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageContext.Provider value={languageValue}>
        <CardSortContext.Provider value={cardSortValue}>
          {children}
        </CardSortContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};
