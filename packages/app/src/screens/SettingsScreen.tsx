import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { ThemePicker } from "@/components/ThemePicker";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { useAuth } from "@/lib/auth";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const SettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { colors } = useTheme();
  const { signOut: clearSession } = useAuth();

  const signOut = useCallback(() => {
    void (async () => {
      await clearSession();
      router.replace(Routes.LOGIN);
    })();
  }, [clearSession]);

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
          <View style={styles.settingControl}>
            <ThemePicker />
          </View>
        </View>

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
            {t("language")}
          </Text>
          <View style={styles.settingControl}>
            <LanguagePicker />
          </View>
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
  settingLabel: {
    ...typography.label,
    flexShrink: 0,
  },
  settingControl: {
    width: 200,
    marginLeft: spacing.md,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
