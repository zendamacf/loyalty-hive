import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { CloseButton } from "@/components/CloseButton";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
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

export const ScanManualEntryScreen = () => {
  const { t } = useTranslation(I18nNamespace.Scan);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    brandName?: string;
    brandId?: string;
    customCard?: string;
    cardNumber?: string;
    view?: CardView;
  }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const selectedBrandId =
    typeof params.brandId === "string" ? params.brandId : null;
  const isCustomCard = params.customCard === "1";
  const initialCardNumber =
    typeof params.cardNumber === "string" ? params.cardNumber : "";
  const cardView: CardView | null =
    params.view === "1D" || params.view === "2D" ? params.view : null;

  const [cardNumber, setCardNumber] = useState(initialCardNumber);
  const [customLabel, setCustomLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);
  const queryClient = useQueryClient();

  const headerTitle = useMemo(() => {
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
    trimmedCardNumber,
    trimmedCustomLabel,
  ]);

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
      <ScreenShell.Body>
        <ScreenHeader title={headerTitle} actions={<CloseButton />} embedded />

        <Form>
          {isCustomCard ? (
            <FormGroup label={t("customCardLabel")}>
              <TextInput
                accessibilityLabel={t("customCardLabel")}
                value={customLabel}
                onChangeText={setCustomLabel}
                placeholder={t("customCardPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
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
            </FormGroup>
          ) : null}

          <FormGroup label={t("cardNumber")} hint={t("manualEntryHelp")}>
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
          </FormGroup>
        </Form>
      </ScreenShell.Body>
    </ScreenShell>
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
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
