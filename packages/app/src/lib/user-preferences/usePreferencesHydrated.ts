import { useLanguage } from "@/i18n/language-context";
import { useCardSort } from "@/lib/card-sort/card-sort-context";
import { useThemeContext } from "@/theme/useThemeContext";

/** True once theme, language, and card-sort preferences have been read from storage. */
export const usePreferencesHydrated = () => {
  const { hydrated: languageHydrated } = useLanguage();
  const { hydrated: cardSortHydrated } = useCardSort();
  const theme = useThemeContext();

  return (theme?.hydrated ?? false) && languageHydrated && cardSortHydrated;
};
