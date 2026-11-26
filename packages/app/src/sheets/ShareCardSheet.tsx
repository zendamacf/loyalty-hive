import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSheetPayload, useSheetRef } from "react-native-actions-sheet";

import { Button } from "@/components/Button";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { AnalyticsEvents, trackAppEvent } from "@/lib/analytics";
import {
  getApiV1SharesOutgoingQueryKey,
  postApiV1SharesMutation,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

/** Light check only. The API validates the email. */
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export const ShareCardSheet = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.SHARE_CARD);
  const { cardId } = useSheetPayload(SheetIds.SHARE_CARD) ?? {};
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { mutateAsync: share, isPending } = useMutation({
    ...postApiV1SharesMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getApiV1SharesOutgoingQueryKey(),
      });
    },
  });

  const trimmedEmail = email.trim();
  const canSend = EMAIL_PATTERN.test(trimmedEmail) && !isPending;
  const event = { scope: cardId ? "card" : "account", card_id: cardId };

  const send = async () => {
    if (!canSend) return;
    setError(null);
    try {
      await share({
        body: cardId
          ? { scope: "card", cardId, email: trimmedEmail }
          : { scope: "account", email: trimmedEmail },
      });
      void trackAppEvent(AnalyticsEvents.CARD_SHARE, event);
      setSent(true);
    } catch (err) {
      void trackAppEvent(AnalyticsEvents.CARD_SHARE_FAILED, event);
      setError(getErrorMessage(err));
    }
  };

  return (
    <ActionSheetFrame
      title={
        sent
          ? t("shareSentTitle")
          : cardId
            ? t("shareCard")
            : t("shareAllCardsTitle")
      }
      closeAccessibilityLabel={t("closeShareCardSheetA11y")}
      footer={
        <View style={styles.footer}>
          {error ? (
            <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
          ) : null}
          {sent ? (
            <Button
              title={t("shareDone")}
              onPress={() => sheetRef.current?.hide()}
            />
          ) : (
            <Button
              title={isPending ? t("shareSending") : t("shareSend")}
              disabled={!canSend}
              onPress={() => {
                void send();
              }}
            />
          )}
        </View>
      }
    >
      {sent ? (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {t("shareSentMessage")}
        </Text>
      ) : (
        <Form>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {cardId ? t("shareCardIntro") : t("shareAccountIntro")}
          </Text>
          <FormGroup label={t("shareEmailLabel")}>
            <TextInput
              accessibilityLabel={t("shareEmailLabel")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("shareEmailPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isPending}
              onSubmitEditing={() => {
                void send();
              }}
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
      )}
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
  message: {
    ...typography.body,
  },
  error: {
    ...typography.caption,
    textAlign: "center",
  },
  footer: {
    gap: spacing.sm,
  },
});
