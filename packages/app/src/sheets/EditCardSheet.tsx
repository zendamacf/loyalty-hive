import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useSheetPayload, useSheetRef } from "react-native-actions-sheet";

import { Button } from "@/components/Button";
import { CardCodeViewToggle } from "@/components/CardCodeViewToggle";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getApiV1CardsQueryKey,
  patchApiV1CardsByIdMutation,
} from "@/lib/api-client";
import { type CardView, resolveCardView } from "@/lib/cardView";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";
import type { EditCardSheetReturnValue } from "./sheets.types";

export const EditCardSheet = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.EDIT_CARD);
  const payload = useSheetPayload(SheetIds.EDIT_CARD);
  const cardId = payload?.cardId ?? "";
  const label = payload?.label ?? "";
  const defaultView = payload?.defaultView ?? "1D";
  const brandName = payload?.brandName ?? "";
  const activeSegmentColor = payload?.activeSegmentColor;
  const hasBrand = Boolean(brandName.trim());
  const queryClient = useQueryClient();

  const labelFieldLabel = hasBrand
    ? t("cardNicknameLabel")
    : t("cardLabelLabel");
  const labelFieldPlaceholder = hasBrand
    ? t("cardNicknamePlaceholder")
    : t("cardLabelPlaceholder");

  const [editLabel, setEditLabel] = useState(label);
  const [editView, setEditView] = useState<CardView>(defaultView);

  useEffect(() => {
    setEditLabel(label);
    setEditView(defaultView);
  }, [defaultView, label]);

  const { mutateAsync: updateCard, isPending: isSaving } = useMutation({
    ...patchApiV1CardsByIdMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const toggleEditView = useCallback(() => {
    setEditView((current) => (current === "1D" ? "2D" : "1D"));
  }, []);

  const onSave = useCallback(async () => {
    if (!cardId || isSaving) {
      return;
    }

    try {
      const updated = await updateCard({
        path: { id: cardId },
        body: {
          label: editLabel.trim() || null,
          view: editView,
        },
      });
      const returnValue: EditCardSheetReturnValue = {
        label: (updated.label ?? editLabel).trim(),
        view: resolveCardView(updated.view ?? editView),
      };
      sheetRef.current?.hide(returnValue);
    } catch (err) {
      Alert.alert(t("saveCardErrorTitle"), getErrorMessage(err));
    }
  }, [cardId, editLabel, editView, isSaving, sheetRef, t, updateCard]);

  return (
    <ActionSheetFrame
      title={t("editCardSheetTitle")}
      closeAccessibilityLabel={t("closeEditCardSheetA11y")}
      footer={
        <Button
          title={isSaving ? t("savingCard") : t("saveCard")}
          onPress={() => {
            void onSave();
          }}
          disabled={!cardId || isSaving}
        />
      }
    >
      <Form>
        <FormGroup label={labelFieldLabel}>
          <TextInput
            accessibilityLabel={labelFieldLabel}
            value={editLabel}
            onChangeText={setEditLabel}
            placeholder={labelFieldPlaceholder}
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

        <FormGroup label={t("defaultViewLabel")}>
          <View style={styles.viewToggle}>
            <CardCodeViewToggle
              view={editView}
              activeSegmentColor={activeSegmentColor}
              onToggle={toggleEditView}
            />
          </View>
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
  viewToggle: {
    alignSelf: "stretch",
  },
});
