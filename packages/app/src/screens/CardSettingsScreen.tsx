import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CloseButton } from "@/components/CloseButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  deleteApiV1CardsByIdMutation,
  getApiV1CardsQueryKey,
} from "@/lib/api-client";
import { resolveCardHeadings } from "@/lib/cardHeadings";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const CardSettingsScreen = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    cardNumber?: string;
    brandName?: string;
    label?: string;
    createdAt?: string;
  }>();

  const cardId = typeof params.id === "string" ? params.id : "";
  const brandName =
    typeof params.brandName === "string" ? params.brandName : "";
  const label = typeof params.label === "string" ? params.label : "";

  const { title, subtitle } = useMemo(
    () => resolveCardHeadings(brandName, label),
    [brandName, label],
  );
  const queryClient = useQueryClient();

  const { mutateAsync: deleteCard, isPending: isDeleting } = useMutation({
    ...deleteApiV1CardsByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const confirmDeleteCard = useCallback(async () => {
    if (!cardId || isDeleting) {
      return;
    }

    try {
      await deleteCard({ path: { id: cardId } });
      router.dismissTo(Routes.CARDS);
    } catch (err) {
      Alert.alert(t("deleteCardErrorTitle"), getErrorMessage(err));
    }
  }, [cardId, deleteCard, isDeleting, t]);

  const confirmDelete = useCallback(() => {
    Alert.alert(t("deleteCardConfirmTitle"), t("deleteCardConfirmMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("deleteCard"),
        style: "destructive",
        onPress: () => {
          void confirmDeleteCard();
        },
      },
    ]);
  }, [confirmDeleteCard, t]);

  return (
    <ScreenShell
      footer={
        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityLabel={t("deleteCardA11y")}
            accessibilityRole="button"
            accessibilityState={{ disabled: !cardId || isDeleting }}
            disabled={!cardId || isDeleting}
            style={[
              styles.deleteButton,
              { backgroundColor: theme.error },
              (!cardId || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={confirmDelete}
          >
            <Text style={styles.deleteButtonText}>{t("deleteCard")}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScreenShell.Body>
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          subtitlePlacement="withTitle"
          actions={<CloseButton />}
          embedded
        />
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingTop: spacing.md,
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
});
