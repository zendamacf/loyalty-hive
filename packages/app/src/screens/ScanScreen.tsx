import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Routes } from "@/constants/routes.constants";
import { postApiV1Cards } from "@/lib/api-client";
import { type CardView, resolveCardViewFromBarcodeType } from "@/lib/cardView";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const ScanScreen = () => {
  const { t } = useTranslation("scan");
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    brandName?: string;
    brandId?: string;
  }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const selectedBrandId =
    typeof params.brandId === "string" ? params.brandId : null;
  const [permission, requestPermission] = useCameraPermissions();
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);

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
        const { data, error } = await postApiV1Cards({
          body: {
            cardNumber: trimmed,
            label: selectedBrandName,
            brandId: selectedBrandId,
            view: cardType,
          },
        });

        if (error) {
          setSaveError(getErrorMessage(error));
          return;
        }

        if (data) {
          router.dismissTo(Routes.CARDS);
        }
      } finally {
        saveLockRef.current = false;
        setIsSaving(false);
      }
    },
    [selectedBrandId, selectedBrandName],
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t("cameraAccessTitle")}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t("cameraAccessMessage")}
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{t("allowCamera")}</Text>
        </Pressable>
      </SafeAreaView>
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

      <View style={styles.overlay}>
        {selectedBrandName ? (
          <Text style={styles.brandTag}>
            {t("addingCard", { brand: selectedBrandName })}
          </Text>
        ) : null}
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
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
    textAlign: "center",
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
    bottom: spacing.lg,
    backgroundColor: "rgba(13, 27, 42, 0.85)",
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  overlayTitle: {
    color: "#FFFFFF",
    ...typography.bodySemibold,
  },
  brandTag: {
    color: "#E2E8F0",
    ...typography.small,
    marginBottom: spacing.xs,
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
