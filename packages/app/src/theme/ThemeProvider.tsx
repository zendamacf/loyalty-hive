import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { colors } from "./theme";
import {
  isThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "./theme.constants";

type ThemeColors = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
  success: string;
};

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeColorsForMode = (isDark: boolean): ThemeColors => ({
  background: isDark ? colors.backgroundDark : colors.backgroundLight,
  surface: isDark ? colors.surfaceDark : colors.surfaceLight,
  textPrimary: isDark ? colors.textPrimaryDark : colors.textPrimaryLight,
  textSecondary: colors.textSecondary,
  border: colors.border,
  primary: colors.primary,
  error: colors.error,
  success: colors.success,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemeMode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && isThemeMode(stored)) {
          setPreference(stored);
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

  const isDark =
    hydrated && preference !== null
      ? preference === "dark"
      : systemScheme === "dark";

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreference(mode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark");
  }, [isDark, setThemeMode]);

  const value = useMemo(
    () => ({
      isDark,
      colors: themeColorsForMode(isDark),
      setThemeMode,
      toggleTheme,
    }),
    [isDark, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
