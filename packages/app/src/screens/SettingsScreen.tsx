import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { client } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const SettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { colors } = useTheme();

  const signOut = useCallback(() => {
    queryClient.clear();
    client.setConfig({ auth: undefined });
    router.replace(Routes.LOGIN);
  }, []);

  return (
    <ScreenShell
      footer={
        <View style={styles.footer}>
          <Button title={t("signOut")} onPress={signOut} />
        </View>
      }
    >
      <ScreenShell.Body>
        <ScreenHeader title={t("title")} actions={<CloseButton />} embedded />

        <View
          style={[
            styles.settingRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
            {t("theme")}
          </Text>
          <ThemeToggle showLabel style={styles.themeToggle} />
        </View>

        <View
          style={[
            styles.settingRow,
            styles.languageRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
            {t("language")}
          </Text>
          <LanguagePicker />
        </View>
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  languageRow: {
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  themeToggle: {
    padding: 0,
  },
  settingLabel: {
    ...typography.label,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
