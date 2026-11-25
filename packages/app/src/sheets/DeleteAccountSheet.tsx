import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSheetRef } from "react-native-actions-sheet";

import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { AnalyticsEvents, trackAppEvent } from "@/lib/analytics";
import { deleteApiV1AuthMeMutation } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

export const DeleteAccountSheet = () => {
  const { t } = useTranslation(I18nNamespace.Settings);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.DELETE_ACCOUNT);
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: deleteAccount, isPending } = useMutation(
    deleteApiV1AuthMeMutation(),
  );

  const canSubmit = password.length > 0 && !isPending;

  const confirmDelete = useCallback(async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);

    try {
      await deleteAccount({ body: { password } });
    } catch (err) {
      void trackAppEvent(AnalyticsEvents.AUTH_ACCOUNT_DELETE_FAILED, {
        reason: "api_error",
      });
      setError(getErrorMessage(err));
      return;
    }

    void trackAppEvent(AnalyticsEvents.AUTH_ACCOUNT_DELETE);
    // Clears the token, the offline card cache and the query cache.
    await signOut();
    setPassword("");
    sheetRef.current?.hide();
    router.replace(Routes.LOGIN);
  }, [canSubmit, deleteAccount, password, signOut, sheetRef]);

  const dismiss = useCallback(() => {
    sheetRef.current?.hide();
  }, [sheetRef]);

  return (
    <ActionSheetFrame
      title={t("deleteAccountConfirmTitle")}
      closeAccessibilityLabel={t("closeDeleteAccountSheetA11y")}
      footer={
        <View style={styles.footerButtons}>
          <TouchableOpacity
            testID="confirm-delete-account"
            accessibilityLabel={t("deleteAccountConfirmYes")}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            style={[
              styles.deleteButton,
              { backgroundColor: theme.error },
              !canSubmit && styles.deleteButtonDisabled,
            ]}
            onPress={() => {
              void confirmDelete();
            }}
          >
            <Text style={styles.deleteButtonText}>
              {isPending
                ? t("deleteAccountDeleting")
                : t("deleteAccountConfirmYes")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t("deleteAccountConfirmNo")}
            accessibilityRole="button"
            style={[styles.dismissButton, { borderColor: theme.border }]}
            onPress={dismiss}
          >
            <Text
              style={[styles.dismissButtonText, { color: theme.textPrimary }]}
            >
              {t("deleteAccountConfirmNo")}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={[styles.message, { color: theme.textSecondary }]}>
        {t("deleteAccountConfirmMessage")}
      </Text>
      <Text style={[styles.label, { color: theme.textPrimary }]}>
        {t("deleteAccountPasswordLabel")}
      </Text>
      <TextInput
        accessibilityLabel={t("deleteAccountPasswordLabel")}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isPending}
        placeholder={t("deleteAccountPasswordPlaceholder")}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        style={[
          styles.input,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
            color: theme.textPrimary,
          },
        ]}
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      ) : null}
    </ActionSheetFrame>
  );
};

const styles = StyleSheet.create({
  message: {
    ...typography.body,
  },
  label: {
    ...typography.bodySemibold,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
    ...typography.body,
  },
  error: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  footerButtons: {
    gap: spacing.sm,
  },
  deleteButton: {
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    ...typography.bodySemibold,
    color: "#FFFFFF",
  },
  dismissButton: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  dismissButtonText: {
    ...typography.bodySemibold,
  },
});
