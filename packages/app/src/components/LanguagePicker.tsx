import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  I18nNamespace,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/i18n.constants";
import { useLanguage } from "@/i18n/useLanguage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const PREFERENCE_LABEL_KEYS: Record<
  SupportedLocale,
  "languageEnglish" | "languageSpanish"
> = {
  en: "languageEnglish",
  es: "languageSpanish",
};

export const LanguagePicker = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { colors } = useTheme();
  const { preference, setLanguagePreference } = useLanguage();

  return (
    <View style={styles.row}>
      {SUPPORTED_LOCALES.map((option) => {
        const selected = preference === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setLanguagePreference(option)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? "#0D1B2A" : colors.textPrimary },
              ]}
            >
              {t(PREFERENCE_LABEL_KEYS[option])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "flex-end",
    maxWidth: "70%",
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionLabel: {
    ...typography.caption,
  },
});
