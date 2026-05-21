import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getApiV1CardsQueryKey,
  postApiV1CardsMutation,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export const ScanManualEntryScreen = () => {
  const { t } = useTranslation(I18nNamespace.Scan);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    brandName?: string;
    brandId?: string;
    label?: string;
  }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const selectedBrandId =
    typeof params.brandId === "string" ? params.brandId : null;
  const customLabel =
    typeof params.label === "string" ? params.label.trim() : null;

  const [cardNumber, setCardNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);
  const queryClient = useQueryClient();

  const headerTitle = useMemo(() => {
    if (selectedBrandId && selectedBrandName) {
      return selectedBrandName;
    }
    if (!selectedBrandId && customLabel) {
      return customLabel;
    }
    return t("enterManually");
  }, [customLabel, selectedBrandId, selectedBrandName, t]);

  const trimmedCardNumber = cardNumber.trim();
  const canSubmit = trimmedCardNumber.length > 0 && !isSaving;

  const { mutateAsync: createCard } = useMutation({
    ...postApiV1CardsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const submitCardNumber = useCallback(async () => {
    if (!trimmedCardNumber || saveLockRef.current) {
      return;
    }
    saveLockRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      const apiLabel = selectedBrandId ? null : customLabel;
      await createCard({
        body: {
          cardNumber: trimmedCardNumber,
          label: apiLabel,
          brandId: selectedBrandId,
          view: null,
        },
      });
      router.dismissTo(Routes.CARDS);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  }, [createCard, customLabel, selectedBrandId, trimmedCardNumber]);

  return (
    <ScreenShell
      footer={
        <View style={styles.footer}>
          {saveError ? (
            <Text style={[styles.saveError, { color: colors.error }]}>
              {saveError}
            </Text>
          ) : null}
          <Button
            title={isSaving ? t("savingCard") : t("addCard")}
            onPress={() => void submitCardNumber()}
            disabled={!canSubmit}
          />
        </View>
      }
    >
      <ScreenShell.Body style={styles.body}>
        <ScreenHeader title={headerTitle} actions={<CloseButton />} embedded />

        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          {t("manualEntryHelp")}
        </Text>

        <TextInput
          accessibilityLabel={t("cardNumber")}
          value={cardNumber}
          onChangeText={setCardNumber}
          placeholder={t("cardNumber")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSaving}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  helpText: {
    ...typography.body,
  },
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
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
