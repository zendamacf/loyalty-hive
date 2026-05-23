import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { useSheetPayload } from "react-native-actions-sheet";

import { Button } from "@/components/Button";
import { CardCodeViewToggle } from "@/components/CardCodeViewToggle";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { I18nNamespace } from "@/i18n/i18n.constants";
import type { CardView } from "@/lib/cardView";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

export const EditCardSheet = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const payload = useSheetPayload(SheetIds.EDIT_CARD);
  const label = payload?.label ?? "";
  const defaultView = payload?.defaultView ?? "1D";
  const activeSegmentColor = payload?.activeSegmentColor;

  const [editLabel, setEditLabel] = useState(label);
  const [editView, setEditView] = useState<CardView>(defaultView);

  useEffect(() => {
    setEditLabel(label);
    setEditView(defaultView);
  }, [defaultView, label]);

  const toggleEditView = useCallback(() => {
    setEditView((current) => (current === "1D" ? "2D" : "1D"));
  }, []);

  const onSave = useCallback(() => {
    // Save wiring will be added when the sheet can be opened from the UI.
  }, []);

  return (
    <ActionSheetFrame
      title={t("editCardSheetTitle")}
      closeAccessibilityLabel={t("closeEditCardSheetA11y")}
      footer={
        <Button title={t("saveCard")} onPress={onSave} disabled={false} />
      }
    >
      <Form>
        <FormGroup label={t("cardLabelLabel")}>
          <TextInput
            accessibilityLabel={t("cardLabelLabel")}
            value={editLabel}
            onChangeText={setEditLabel}
            placeholder={t("cardLabelPlaceholder")}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
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
