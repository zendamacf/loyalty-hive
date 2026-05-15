import { router } from "expo-router";
import { XIcon } from "lucide-react-native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Routes } from "@/constants/routes.constants";
import { ICON_SIZE_MD } from "@/constants/ui.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { client } from "@/lib/api-client";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const SettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { t: tCommon } = useTranslation(I18nNamespace.Common);
  const { colors } = useTheme();

  const signOut = useCallback(() => {
    client.setConfig({ auth: undefined });
    router.replace(Routes.LOGIN);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t("title")}
          </Text>
          <Pressable
            accessibilityLabel={tCommon("close")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <XIcon color={colors.textPrimary} size={ICON_SIZE_MD} />
          </Pressable>
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
      </View>

      <View style={styles.footer}>
        <Button title={t("signOut")} onPress={signOut} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  closeButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
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
