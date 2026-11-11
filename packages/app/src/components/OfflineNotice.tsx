import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";

import { I18nNamespace } from "@/i18n/i18n.constants";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const OfflineNotice = () => {
  const { t } = useTranslation(I18nNamespace.Common);
  const { theme } = useTheme();

  return (
    <Text
      accessibilityRole="alert"
      style={[styles.text, { color: theme.textSecondary }]}
      testID="offline-notice"
    >
      {t("offlineNotice")}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    ...typography.caption,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
