import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { ThemePicker } from "@/components/ThemePicker";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  AnalyticsEvents,
  trackAppEvent,
  useTrackScreenView,
} from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { showDeleteAccountSheet } from "@/sheets";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const SettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { theme } = useTheme();
  const { signOut: clearSession } = useAuth();
  useTrackScreenView(Routes.SETTINGS, { title: "Settings Screen" });

  const signOut = useCallback(() => {
    void (async () => {
      void trackAppEvent(AnalyticsEvents.AUTH_SIGN_OUT);
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

        <Form>
          <FormGroup label={t("theme")}>
            <ThemePicker />
          </FormGroup>
          <FormGroup label={t("language")}>
            <LanguagePicker />
          </FormGroup>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("sharing")}
            onPress={() => router.push(Routes.SHARING)}
          >
            <Text style={[typography.link, { color: theme.textPrimary }]}>
              {t("sharing")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("about")}
            onPress={() => router.push(Routes.ABOUT)}
          >
            <Text style={[typography.link, { color: theme.textPrimary }]}>
              {t("about")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("deleteAccount")}
            testID="delete-account"
            onPress={() => void showDeleteAccountSheet()}
          >
            <Text style={[typography.link, { color: theme.error }]}>
              {t("deleteAccount")}
            </Text>
          </Pressable>
        </Form>
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingTop: spacing.md,
  },
});
