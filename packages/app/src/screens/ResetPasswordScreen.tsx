import { router, useLocalSearchParams } from "expo-router";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
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
import { postApiV1AuthResetPassword } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";
import { useAuth } from "@/lib/auth";
import {
  getPasswordPolicyFailure,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-policy";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { PasswordPolicyChecklist } from "../components/PasswordPolicyChecklist";
import { icon as iconSize, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type Status = "form" | "success" | "error";

export const ResetPasswordScreen = () => {
  const { t } = useTranslation(I18nNamespace.Auth);
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { signOut } = useAuth();
  useTrackScreenView(Routes.RESET_PASSWORD, { title: "Reset password" });

  const hasToken = typeof token === "string" && token.length > 0;
  const [status, setStatus] = useState<Status>(hasToken ? "form" : "error");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    hasToken ? null : t("resetPasswordMissingToken"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (typeof token !== "string" || !token) return;
    setError(null);

    const policyFailure = getPasswordPolicyFailure(password);
    if (policyFailure) {
      setError(
        policyFailure === "too_short"
          ? t("passwordPolicy.too_short", { count: PASSWORD_MIN_LENGTH })
          : t(`passwordPolicy.${policyFailure}`),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: apiError, response } = await postApiV1AuthResetPassword({
        headers: authApiHeaders(),
        body: { token, password },
      });

      if (apiError) {
        void trackAppEvent(AnalyticsEvents.AUTH_PASSWORD_RESET_FAILED, {
          reason: "api_error",
          ...(response?.status !== undefined
            ? { status_code: response.status }
            : {}),
        });
        if (response?.status === 400) {
          setStatus("error");
          setError(t("resetPasswordFailed"));
        } else {
          setError(getErrorMessage(apiError));
        }
        return;
      }

      void trackAppEvent(AnalyticsEvents.AUTH_PASSWORD_RESET);
      // The server revoked all earlier sessions, so drop any local token too.
      await signOut();
      setStatus("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <AppTitle />
        {status === "form" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("resetPasswordTitle")}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t("resetPasswordBody")}
            </Text>
            <View
              style={[
                styles.passwordField,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholder={t("newPassword")}
                placeholderTextColor={theme.textSecondary}
                returnKeyType="go"
                secureTextEntry={!showPassword}
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => {
                  if (!isSubmitting) void submit();
                }}
              />
              <Pressable
                accessibilityLabel={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={8}
                style={styles.passwordToggle}
                testID="password-toggle"
                onPress={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <EyeOffIcon color={theme.textSecondary} size={iconSize.md} />
                ) : (
                  <EyeIcon color={theme.textSecondary} size={iconSize.md} />
                )}
              </Pressable>
            </View>
            <PasswordPolicyChecklist password={password} />
            {error ? (
              <Text style={[styles.error, { color: theme.error }]}>
                {error}
              </Text>
            ) : null}
            <Button
              disabled={isSubmitting}
              title={
                isSubmitting
                  ? t("resetPasswordSubmitting")
                  : t("resetPasswordSubmit")
              }
              onPress={() => void submit()}
            />
          </>
        ) : null}
        {status === "success" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("resetPasswordSuccess")}
            </Text>
            <Button
              title={t("resetPasswordSignIn")}
              onPress={() => router.replace(Routes.LOGIN)}
            />
          </>
        ) : null}
        {status === "error" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("resetPasswordFailedTitle")}
            </Text>
            {error ? (
              <Text style={[styles.body, { color: theme.error }]}>{error}</Text>
            ) : null}
            <Button
              title={t("resetPasswordRequestNew")}
              onPress={() => router.replace(Routes.FORGOT_PASSWORD)}
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
  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingRight: spacing.xs,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  passwordToggle: {
    padding: spacing.xs,
  },
  error: {
    ...typography.caption,
    textAlign: "center",
  },
});
