import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { CopyIcon } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
import { icon, radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

function formatCreatedAt(value: string, locale: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export const CardSettingsScreen = () => {
  const { t, i18n } = useTranslation(I18nNamespace.Cards);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    cardNumber?: string;
    brandName?: string;
    label?: string;
    createdAt?: string;
  }>();

  const cardId = typeof params.id === "string" ? params.id : "";
  const cardNumber =
    typeof params.cardNumber === "string" ? params.cardNumber : "";
  const brandName =
    typeof params.brandName === "string" ? params.brandName : "";
  const label = typeof params.label === "string" ? params.label : "";
  const createdAt =
    typeof params.createdAt === "string" ? params.createdAt : "";

  const { title, subtitle } = useMemo(
    () => resolveCardHeadings(brandName, label),
    [brandName, label],
  );
  const createdOnLabel = useMemo(
    () => formatCreatedAt(createdAt, i18n.language),
    [createdAt, i18n.language],
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

  const copyCardNumber = useCallback(() => {
    if (cardNumber) {
      void Clipboard.setStringAsync(cardNumber);
    }
  }, [cardNumber]);

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
              { backgroundColor: colors.error },
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

        <View style={styles.details}>
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {t("cardNumberLabel")}
            </Text>
            <View style={styles.detailValueRow}>
              <Text
                style={[styles.detailValue, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {cardNumber}
              </Text>
              <Pressable
                accessibilityLabel={t("copyCardNumberA11y")}
                accessibilityRole="button"
                disabled={!cardNumber}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
                onPress={copyCardNumber}
              >
                <CopyIcon color={colors.textSecondary} size={icon.md} />
              </Pressable>
            </View>
          </View>

          {createdOnLabel ? (
            <View style={styles.detailBlock}>
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                {t("createdOnLabel")}
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {createdOnLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  details: {
    gap: spacing.lg,
  },
  detailBlock: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
  },
  detailValue: {
    ...typography.body,
    flex: 1,
  },
  detailValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  copyButton: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonPressed: {
    opacity: 0.55,
  },
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
