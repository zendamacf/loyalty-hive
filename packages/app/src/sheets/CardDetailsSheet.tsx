import * as Clipboard from "expo-clipboard";
import { CopyIcon } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSheetPayload } from "react-native-actions-sheet";

import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { formatCreatedAt } from "@/lib/formatCreatedAt";
import { icon, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

export const CardDetailsSheet = () => {
  const { t, i18n } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const { cardNumber = "", createdAt = "" } =
    useSheetPayload(SheetIds.CARD_DETAILS) ?? {};
  const createdOnLabel = useMemo(
    () => formatCreatedAt(createdAt, i18n.language),
    [createdAt, i18n.language],
  );

  const copyCardNumber = useCallback(() => {
    if (cardNumber) {
      void Clipboard.setStringAsync(cardNumber);
    }
  }, [cardNumber]);

  return (
    <ActionSheetFrame
      title={t("cardDetailsSheetTitle")}
      closeAccessibilityLabel={t("closeCardDetailsSheetA11y")}
    >
      <Form>
        <FormGroup label={t("cardNumberLabel")}>
          <View style={styles.detailValueRow}>
            <Text
              style={[styles.detailValue, { color: theme.textPrimary }]}
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
              <CopyIcon color={theme.textSecondary} size={icon.md} />
            </Pressable>
          </View>
        </FormGroup>

        {createdOnLabel ? (
          <FormGroup label={t("createdOnLabel")}>
            <Text style={[styles.valueText, { color: theme.textPrimary }]}>
              {createdOnLabel}
            </Text>
          </FormGroup>
        ) : null}
      </Form>
    </ActionSheetFrame>
  );
};

const styles = StyleSheet.create({
  valueText: {
    ...typography.body,
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
});
