import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSheetPayload, useSheetRef } from "react-native-actions-sheet";

import { Button } from "@/components/Button";
import { Form } from "@/components/Form";
import { FormGroup } from "@/components/FormGroup";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { getUrlHost, trackBrandRequestSubmitted } from "@/lib/analytics";
import {
  type BrandRequestResponse,
  postApiV1BrandRequestsMutation,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

import { ActionSheetFrame } from "./ActionSheetFrame";
import { SheetIds } from "./sheetIds";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const RequestBrandSheet = () => {
  const { t } = useTranslation(I18nNamespace.Brands);
  const { theme } = useTheme();
  const sheetRef = useSheetRef(SheetIds.REQUEST_BRAND);
  const payload = useSheetPayload(SheetIds.REQUEST_BRAND);
  const initialName = payload?.requestedName ?? "";

  const [requestedName, setRequestedName] = useState(initialName);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<BrandRequestResponse | null>(null);

  useEffect(() => {
    setRequestedName(initialName);
    setUrl("");
    setNotes("");
    setSubmitError(null);
    setSubmittedRequest(null);
  }, [initialName]);

  const { mutateAsync: submitRequest, isPending } = useMutation({
    ...postApiV1BrandRequestsMutation(),
  });

  const trimmedName = requestedName.trim();
  const trimmedUrl = url.trim();
  const trimmedNotes = notes.trim();
  const canSubmit =
    trimmedName.length >= 2 &&
    isValidHttpUrl(trimmedUrl) &&
    !isPending &&
    submittedRequest === null;

  const submitBrandRequest = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);

    try {
      const response = await submitRequest({
        body: {
          requestedName: trimmedName,
          url: trimmedUrl,
          notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        },
      });

      trackBrandRequestSubmitted({
        request_id: response.id,
        requested_name: response.requestedName,
        url_host: getUrlHost(response.url),
        has_notes: Boolean(response.notes),
        source: "empty_search",
      });

      setSubmittedRequest(response);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }, [canSubmit, submitRequest, trimmedName, trimmedNotes, trimmedUrl]);

  const openLinkedCustomCardScan = useCallback(() => {
    if (!submittedRequest) {
      return;
    }

    sheetRef.current?.hide();
    router.push({
      pathname: Routes.SCAN,
      params: {
        customCard: "1",
        brandRequestId: submittedRequest.id,
        suggestedLabel: submittedRequest.requestedName,
      },
    });
  }, [sheetRef, submittedRequest]);

  const sheetTitle = useMemo(() => {
    if (submittedRequest) {
      return t("requestBrandSuccessTitle");
    }
    return t("requestBrandTitle");
  }, [submittedRequest, t]);

  return (
    <ActionSheetFrame
      title={sheetTitle}
      closeAccessibilityLabel={t("closeRequestBrandSheetA11y")}
      footer={
        submittedRequest ? (
          <View style={styles.footer}>
            <Button
              title={t("requestBrandAddCustomCard")}
              onPress={openLinkedCustomCardScan}
            />
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.border },
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={() => {
                sheetRef.current?.hide();
              }}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textPrimary },
                ]}
              >
                {t("requestBrandDone")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            {submitError ? (
              <Text style={[styles.submitError, { color: theme.error }]}>
                {submitError}
              </Text>
            ) : null}
            <Button
              title={
                isPending
                  ? t("requestBrandSubmitting")
                  : t("requestBrandSubmit")
              }
              onPress={() => {
                void submitBrandRequest();
              }}
              disabled={!canSubmit}
            />
          </View>
        )
      }
    >
      {submittedRequest ? (
        <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
          {t("requestBrandSuccessMessage")}
        </Text>
      ) : (
        <Form>
          <FormGroup label={t("requestBrandNameLabel")}>
            <TextInput
              accessibilityLabel={t("requestBrandNameLabel")}
              value={requestedName}
              onChangeText={setRequestedName}
              placeholder={t("requestBrandNameLabel")}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isPending}
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

          <FormGroup label={t("requestBrandUrlLabel")}>
            <TextInput
              accessibilityLabel={t("requestBrandUrlLabel")}
              value={url}
              onChangeText={setUrl}
              placeholder={t("requestBrandUrlPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isPending}
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

          <FormGroup label={t("requestBrandNotesLabel")}>
            <TextInput
              accessibilityLabel={t("requestBrandNotesLabel")}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("requestBrandNotesPlaceholder")}
              placeholderTextColor={theme.textSecondary}
              multiline
              editable={!isPending}
              style={[
                styles.input,
                styles.notesInput,
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
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  submitError: {
    ...typography.caption,
    textAlign: "center",
  },
  successMessage: {
    ...typography.body,
  },
  footer: {
    gap: spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...typography.bodySemibold,
  },
});
