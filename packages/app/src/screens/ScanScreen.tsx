import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { XIcon } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScreenShell } from "@/components/ScreenShell";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  getApiV1CardsQueryKey,
  postApiV1CardsMutation,
} from "@/lib/api-client";
import { type CardView, resolveCardViewFromBarcodeType } from "@/lib/cardView";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { icon, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const ScanScreen = () => {
  const { t } = useTranslation([I18nNamespace.Scan, I18nNamespace.Common]);
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
  const [permission, requestPermission] = useCameraPermissions();
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { mutateAsync: createCard } = useMutation({
    ...postApiV1CardsMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    },
  });

  const saveCard = useCallback(
    async (cardNumber: string, cardType: CardView | null) => {
      const trimmed = cardNumber.trim();
      if (!trimmed || saveLockRef.current) {
        return;
      }
      saveLockRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      try {
        const apiLabel = selectedBrandId ? null : customLabel;
        await createCard({
          body: {
            cardNumber: trimmed,
            label: apiLabel,
            brandId: selectedBrandId,
            view: cardType,
          },
        });
        router.dismissTo(Routes.CARDS);
      } catch (err) {
        setSaveError(getErrorMessage(err));
      } finally {
        saveLockRef.current = false;
        setIsSaving(false);
      }
    },
    [createCard, customLabel, selectedBrandId],
  );

  const handleScan = (result: BarcodeScanningResult) => {
    void saveCard(result.data, resolveCardViewFromBarcodeType(result.type));
  };

  const submitManualCode = () => {
    const normalizedCode = manualCode.trim();
    if (!normalizedCode) {
      return;
    }

    setIsManualEntryOpen(false);
    void saveCard(normalizedCode, null);
  };

  const abortScan = useCallback(() => {
    router.back();
  }, []);

  if (!permission) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          {t("checkingPermissions")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenShell style={styles.permissionContainer}>
        <ScreenHeader
          title={t("cameraAccessTitle")}
          align="center"
          style={styles.permissionHeader}
        />
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t("cameraAccessMessage")}
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{t("allowCamera")}</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#000000" }]}>
      <CameraView
        testID="scan-camera"
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isSaving ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: [
            "aztec",
            "codabar",
            "code39",
            "code93",
            "code128",
            "ean8",
            "ean13",
            "itf14",
            "pdf417",
            "upc_a",
            "upc_e",
            "qr",
          ],
        }}
      />

      <View style={[styles.overlay, { bottom: spacing.lg + insets.bottom }]}>
        <View style={styles.overlayHeader}>
          <View style={styles.overlayHeaderText}>
            {selectedBrandId && selectedBrandName ? (
              <Text style={styles.brandTag}>
                {t("addingCard", { brand: selectedBrandName })}
              </Text>
            ) : null}
            {!selectedBrandId && customLabel ? (
              <Text style={styles.brandTag}>
                {t("addingCustomCard", { label: customLabel })}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={t("close", { ns: I18nNamespace.Common })}
            accessibilityRole="button"
            disabled={isSaving}
            hitSlop={12}
            style={({ pressed }) => [
              styles.overlayClose,
              pressed && styles.overlayClosePressed,
            ]}
            onPress={abortScan}
          >
            <XIcon color="#FFFFFF" size={icon.md} />
          </Pressable>
        </View>
        <Text style={styles.overlayTitle}>
          {isSaving ? t("savingCard") : t("scanPrompt")}
        </Text>

        {saveError ? (
          <Text style={[styles.saveError, { color: colors.error }]}>
            {saveError}
          </Text>
        ) : null}

        {!isSaving ? (
          <View style={styles.manualEntryWrapper}>
            <Pressable
              onPress={() => setIsManualEntryOpen((current) => !current)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {isManualEntryOpen ? t("closeManualEntry") : t("enterManually")}
              </Text>
            </Pressable>

            {isManualEntryOpen ? (
              <View style={styles.manualEntryFields}>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder={t("cardNumber")}
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: "#FFFFFF" },
                  ]}
                />
                <Pressable
                  onPress={submitManualCode}
                  style={[
                    styles.primaryButton,
                    styles.manualSubmitButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("useCardNumber")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  permissionHeader: {
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: "#0D1B2A",
    ...typography.bodySemibold,
  },
  overlay: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(13, 27, 42, 0.85)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  overlayHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  overlayClose: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayClosePressed: {
    opacity: 0.55,
  },
  overlayTitle: {
    color: "#FFFFFF",
    ...typography.bodySemibold,
  },
  brandTag: {
    color: "#E2E8F0",
    ...typography.small,
  },
  saveError: {
    marginTop: spacing.sm,
    ...typography.caption,
  },
  manualEntryWrapper: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  manualEntryFields: {
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  secondaryButton: {
    flex: 1,
    borderColor: "#94A3B8",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#E2E8F0",
    ...typography.bodySemibold,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  manualSubmitButton: {
    flex: 0,
  },
  primaryButtonText: {
    color: "#0D1B2A",
    ...typography.bodyBold,
  },
});
