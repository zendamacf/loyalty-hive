import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSheetPayload, useSheetRef } from "react-native-actions-sheet";

import { Button } from "@/components/Button";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getApiV1CardsQueryKey,
  postApiV1CardsMutation,
} from "@/lib/api-client";
import type { CardView } from "@/lib/cardView";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

export const ScanManualEntrySheet = () => {
  const { t } = useTranslation(I18nNamespace.Scan);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.SCAN_MANUAL_ENTRY);
  const payload = useSheetPayload(SheetIds.SCAN_MANUAL_ENTRY);
  const selectedBrandName = payload?.brandName ?? null;
  const selectedBrandId = payload?.brandId ?? null;
  const isCustomCard = payload?.isCustomCard ?? false;
  const initialCardNumber = payload?.initialCardNumber ?? "";
  const cardView: CardView | null = payload?.cardView ?? null;

  const [cardNumber, setCardNumber] = useState(initialCardNumber);
  const [customLabel, setCustomLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setCardNumber(initialCardNumber);
    setCustomLabel("");
    setSaveError(null);
    setIsSaving(false);
    saveLockRef.current = false;
  }, [initialCardNumber]);

  const sheetTitle = useMemo(() => {
    if (selectedBrandId && selectedBrandName) {
      return selectedBrandName;
    }
    return t("enterManually");
  }, [selectedBrandId, selectedBrandName, t]);

  const trimmedCardNumber = cardNumber.trim();
  const trimmedCustomLabel = customLabel.trim();
  const canSubmit =
    trimmedCardNumber.length > 0 &&
    (!isCustomCard || trimmedCustomLabel.length > 0) &&
    !isSaving;

  const { mutateAsync: createCard } = useMutation({
    ...postApiV1CardsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const submitCardNumber = useCallback(async () => {
    if (!canSubmit || saveLockRef.current) {
      return;
    }
    saveLockRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      await createCard({
        body: {
          cardNumber: trimmedCardNumber,
          label: isCustomCard ? trimmedCustomLabel : null,
          brandId: selectedBrandId,
          view: cardView,
        },
      });
      sheetRef.current?.hide();
      router.dismissTo(Routes.CARDS);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  }, [
    canSubmit,
    cardView,
    createCard,
    isCustomCard,
    selectedBrandId,
    sheetRef,
    trimmedCardNumber,
    trimmedCustomLabel,
  ]);

  return (
    <ActionSheetFrame
      title={sheetTitle}
      closeAccessibilityLabel={t("closeScanManualEntrySheetA11y")}
      footer={
        <View style={styles.footer}>
          {saveError ? (
            <Text style={[styles.saveError, { color: theme.error }]}>
              {saveError}
            </Text>
          ) : null}
          <Button
            title={isSaving ? t("savingCard") : t("addCard")}
            onPress={() => {
              void submitCardNumber();
            }}
            disabled={!canSubmit}
          />
        </View>
      }
    >
      <Form>
        {isCustomCard ? (
          <FormGroup label={t("customCardLabel")}>
            <TextInput
              accessibilityLabel={t("customCardLabel")}
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder={t("customCardLabel")}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isSaving}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  backgroundColor: theme.surface,
                },
              ]}
            />
          </FormGroup>
        ) : null}

        <FormGroup label={t("cardNumber")} hint={t("manualEntryHelp")}>
          <TextInput
            accessibilityLabel={t("cardNumber")}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder={t("cardNumber")}
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.textPrimary,
                backgroundColor: theme.surface,
              },
            ]}
          />
        </FormGroup>
      </Form>
    </ActionSheetFrame>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  saveError: {
    ...typography.caption,
    textAlign: "center",
  },
  footer: {
    gap: spacing.sm,
  },
});
