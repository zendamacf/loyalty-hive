import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  AnalyticsEvents,
  trackAppEvent,
  useTrackScreenView,
} from "@/lib/analytics";
import { postApiV1AuthResendVerification } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const CheckEmailScreen = () => {
  const { t } = useTranslation(I18nNamespace.Auth);
  const { theme } = useTheme();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { user, refreshUser, isAuthenticated } = useAuth();
  useTrackScreenView(Routes.CHECK_EMAIL, { title: "Check email" });

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const routeEmail =
    typeof emailParam === "string"
      ? emailParam
      : Array.isArray(emailParam)
        ? emailParam[0]
        : undefined;
  const email = routeEmail ?? user?.email ?? "";

  useEffect(() => {
    if (isAuthenticated && !email) {
      void refreshUser();
    }
  }, [isAuthenticated, email, refreshUser]);

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setInfo(null);
    setIsResending(true);
    try {
      const { error: apiError, response } =
        await postApiV1AuthResendVerification({
          headers: authApiHeaders(),
          body: { email },
        });
      if (apiError) {
        void trackAppEvent(AnalyticsEvents.AUTH_EMAIL_RESEND_FAILED, {
          reason: "api_error",
          ...(response?.status !== undefined
            ? { status_code: response.status }
            : {}),
        });
        setError(getErrorMessage(apiError));
        return;
      }
      void trackAppEvent(AnalyticsEvents.AUTH_EMAIL_RESEND);
      setInfo(t("checkEmailResendSuccess"));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifiedRefresh = async () => {
    setError(null);
    setInfo(null);
    setIsRefreshing(true);
    try {
      const nextUser = await refreshUser();
      if (nextUser?.emailVerified) {
        router.replace(Routes.CARDS);
        return;
      }
      setInfo(t("checkEmailNotVerifiedYet"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenMail = () => {
    void Linking.openURL("mailto:");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <AppTitle />
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t("checkEmailTitle")}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {t("checkEmailBody", { email })}
        </Text>
        {error ? (
          <Text style={[styles.feedback, { color: theme.error }]}>{error}</Text>
        ) : null}
        {info ? (
          <Text style={[styles.feedback, { color: theme.textSecondary }]}>
            {info}
          </Text>
        ) : null}
        <Button title={t("checkEmailOpenMail")} onPress={handleOpenMail} />
        <Button
          title={isResending ? t("checkEmailResending") : t("checkEmailResend")}
          onPress={() => void handleResend()}
          disabled={isResending || !email}
        />
        <Button
          title={
            isRefreshing ? t("checkEmailRefreshing") : t("checkEmailVerified")
          }
          onPress={() => void handleVerifiedRefresh()}
          disabled={isRefreshing}
        />
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
  feedback: {
    ...typography.body,
    textAlign: "center",
  },
});
