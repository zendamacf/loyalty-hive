import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  AnalyticsEvents,
  trackAppEvent,
  useTrackScreenView,
} from "@/lib/analytics";
import { postApiV1AuthForgotPassword } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation(I18nNamespace.Auth);
  const { theme } = useTheme();
  useTrackScreenView(Routes.FORGOT_PASSWORD, { title: "Forgot password" });

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("enterEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: apiError, response } = await postApiV1AuthForgotPassword({
        headers: authApiHeaders(),
        body: { email: trimmedEmail },
      });
      if (apiError) {
        void trackAppEvent(AnalyticsEvents.AUTH_PASSWORD_RESET_REQUEST_FAILED, {
          reason: "api_error",
          ...(response?.status !== undefined
            ? { status_code: response.status }
            : {}),
        });
        setError(getErrorMessage(apiError));
        return;
      }
      void trackAppEvent(AnalyticsEvents.AUTH_PASSWORD_RESET_REQUEST);
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <AppTitle />
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {t("forgotPasswordTitle")}
        </Text>
        {sent ? (
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {t("forgotPasswordSuccess")}
          </Text>
        ) : (
          <>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t("forgotPasswordBody")}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              placeholder={t("email")}
              placeholderTextColor={theme.textSecondary}
              returnKeyType="go"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => {
                if (!isSubmitting) void submit();
              }}
            />
            {error ? (
              <Text style={[styles.error, { color: theme.error }]}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={isSubmitting}
              title={
                isSubmitting
                  ? t("forgotPasswordSubmitting")
                  : t("forgotPasswordSubmit")
              }
              onPress={() => void submit()}
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          testID="back-to-sign-in"
          onPress={() => router.replace(Routes.LOGIN)}
        >
          <Text style={[styles.link, { color: theme.primary }]}>
            {t("forgotPasswordBackToSignIn")}
          </Text>
        </Pressable>
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
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  error: {
    ...typography.caption,
    textAlign: "center",
  },
  link: {
    ...typography.link,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
