import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { useTrackScreenView } from "@/lib/analytics";
import { postApiV1AuthVerifyEmail } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const VerifyEmailScreen = () => {
  const { t } = useTranslation(I18nNamespace.Auth);
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { isAuthenticated, refreshUser } = useAuth();
  useTrackScreenView(Routes.VERIFY_EMAIL, { title: "Verify email" });

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token || typeof token !== "string") {
        setStatus("error");
        setError(t("verifyEmailMissingToken"));
        return;
      }

      const { data, error: apiError } = await postApiV1AuthVerifyEmail({
        headers: authApiHeaders(),
        body: { token },
      });

      if (apiError || !data?.verified) {
        setStatus("error");
        setError(getErrorMessage(apiError) ?? t("verifyEmailFailed"));
        return;
      }

      if (isAuthenticated) {
        await refreshUser();
      }
      setStatus("success");
    };

    void run();
  }, [token, isAuthenticated, refreshUser, t]);

  const goNext = () => {
    if (isAuthenticated) {
      router.replace(Routes.CARDS);
      return;
    }
    router.replace(Routes.LOGIN);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <AppTitle />
        {status === "loading" ? (
          <>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t("verifyEmailWorking")}
            </Text>
          </>
        ) : null}
        {status === "success" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("verifyEmailSuccess")}
            </Text>
            <Button title={t("verifyEmailContinue")} onPress={goNext} />
          </>
        ) : null}
        {status === "error" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("verifyEmailFailedTitle")}
            </Text>
            {error ? (
              <Text style={[styles.body, { color: theme.error }]}>{error}</Text>
            ) : null}
            <Button
              title={t("verifyEmailBackToSignIn")}
              onPress={() => router.replace(Routes.LOGIN)}
            />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    textAlign: "center",
  },
});
