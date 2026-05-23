import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSheetPayload, useSheetRef } from "react-native-actions-sheet";

import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  deleteApiV1CardsByIdMutation,
  getApiV1CardsQueryKey,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

export const DeleteCardSheet = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.DELETE_CARD);
  const { cardId = "" } = useSheetPayload(SheetIds.DELETE_CARD) ?? {};
  const queryClient = useQueryClient();

  const { mutateAsync: deleteCard, isPending: isDeleting } = useMutation({
    ...deleteApiV1CardsByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const confirmDelete = useCallback(async () => {
    if (!cardId || isDeleting) {
      return;
    }

    try {
      await deleteCard({ path: { id: cardId } });
      sheetRef.current?.hide();
      router.dismissTo(Routes.CARDS);
    } catch (err) {
      Alert.alert(t("deleteCardErrorTitle"), getErrorMessage(err));
    }
  }, [cardId, deleteCard, isDeleting, sheetRef, t]);

  const dismiss = useCallback(() => {
    sheetRef.current?.hide();
  }, [sheetRef]);

  return (
    <ActionSheetFrame
      title={t("deleteCardConfirmTitle")}
      closeAccessibilityLabel={t("closeDeleteCardSheetA11y")}
      footer={
        <View style={styles.footerButtons}>
          <TouchableOpacity
            testID="confirm-delete-card"
            accessibilityLabel={t("deleteCardConfirmYes")}
            accessibilityRole="button"
            accessibilityState={{ disabled: !cardId || isDeleting }}
            disabled={!cardId || isDeleting}
            style={[
              styles.deleteButton,
              { backgroundColor: theme.error },
              (!cardId || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={() => {
              void confirmDelete();
            }}
          >
            <Text style={styles.deleteButtonText}>
              {t("deleteCardConfirmYes")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t("deleteCardConfirmNo")}
            accessibilityRole="button"
            style={[styles.dismissButton, { borderColor: theme.border }]}
            onPress={dismiss}
          >
            <Text
              style={[styles.dismissButtonText, { color: theme.textPrimary }]}
            >
              {t("deleteCardConfirmNo")}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={[styles.message, { color: theme.textSecondary }]}>
        {t("deleteCardConfirmMessage")}
      </Text>
    </ActionSheetFrame>
  );
};

const styles = StyleSheet.create({
  message: {
    ...typography.body,
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
