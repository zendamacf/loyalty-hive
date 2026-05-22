import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

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
import { useAuth } from "@/lib/auth";
import { spacing } from "@/theme/theme";

export const SettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
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

        <Form>
          <FormGroup label={t("theme")}>
            <ThemePicker />
          </FormGroup>
          <FormGroup label={t("language")}>
            <LanguagePicker />
          </FormGroup>
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
