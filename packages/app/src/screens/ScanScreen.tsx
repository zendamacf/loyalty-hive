import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CloseButton } from "@/components/CloseButton";
import { ScanGuideOverlay } from "@/components/ScanGuideOverlay";
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
import { showScanManualEntrySheet } from "@/sheets";
import { radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const ScanScreen = () => {
  const { t } = useTranslation(I18nNamespace.Scan);
  const { theme } = useTheme();
  const params = useLocalSearchParams<{
    brandName?: string;
    brandId?: string;
    customCard?: string;
    defaultView?: CardView;
  }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const selectedBrandId =
    typeof params.brandId === "string" ? params.brandId : null;
  const isCustomCard = params.customCard === "1";
  const defaultView: CardView | null =
    params.defaultView === "1D" || params.defaultView === "2D"
      ? params.defaultView
      : null;

  const scanPrompt = useMemo(() => {
    switch (defaultView) {
      case "1D":
        return t("scanPromptBarcode");
      case "2D":
        return t("scanPromptQrCode");
      default:
        return t("scanPrompt");
    }
  }, [defaultView, t]);

  const hasHeaderContext = Boolean(selectedBrandId && selectedBrandName);

  const [permission, requestPermission] = useCameraPermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLockRef = useRef(false);
  const scanLockRef = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const queryClient = useQueryClient();

  const headerTitle = useMemo(() => {
    if (selectedBrandId && selectedBrandName) {
      return selectedBrandName;
    }
    return isSaving ? t("savingCard") : scanPrompt;
  }, [isSaving, scanPrompt, selectedBrandId, selectedBrandName, t]);

  const headerSubtitle = useMemo(() => {
    if (!hasHeaderContext) {
      return undefined;
    }
    return isSaving ? t("savingCard") : scanPrompt;
  }, [hasHeaderContext, isSaving, scanPrompt, t]);

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
        await createCard({
          body: {
            cardNumber: trimmed,
            label: null,
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
    [createCard, selectedBrandId],
  );

  const openManualEntry = useCallback(
    async (prefill?: { cardNumber: string; view: CardView | null }) => {
      if (manualEntryOpen || scanLockRef.current) {
        return;
      }
      scanLockRef.current = true;
      setManualEntryOpen(true);
      try {
        await showScanManualEntrySheet({
          brandId: selectedBrandId,
          brandName: selectedBrandName,
          isCustomCard,
          initialCardNumber: prefill?.cardNumber ?? "",
          cardView: prefill?.view ?? null,
        });
      } finally {
        setManualEntryOpen(false);
        scanLockRef.current = false;
      }
    },
    [isCustomCard, manualEntryOpen, selectedBrandId, selectedBrandName],
  );

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanLockRef.current || manualEntryOpen || isSaving) {
        return;
      }

      if (isCustomCard) {
        void openManualEntry({
          cardNumber: result.data,
          view: resolveCardViewFromBarcodeType(result.type),
        });
        return;
      }

      void saveCard(result.data, resolveCardViewFromBarcodeType(result.type));
    },
    [isCustomCard, isSaving, manualEntryOpen, openManualEntry, saveCard],
  );

  const isScanningEnabled = !manualEntryOpen && !isSaving;

  useEffect(() => {
    if (!permission?.granted || !manualEntryOpen) {
      return;
    }
    void cameraRef.current?.pausePreview().catch(() => {
      // Native view may not be mounted yet.
    });
    return () => {
      void cameraRef.current?.resumePreview().catch(() => {
        // Native view may have unmounted while the sheet was open.
      });
    };
  }, [manualEntryOpen, permission?.granted]);

  if (!permission) {
    return (
      <ScreenShell style={styles.permissionContainer}>
        <Text style={[styles.message, { color: theme.textPrimary }]}>
          {t("checkingPermissions")}
        </Text>
      </ScreenShell>
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
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {t("cameraAccessMessage")}
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={[styles.button, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.buttonText}>{t("allowCamera")}</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenShell.Body style={styles.body}>
        <ScreenHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          subtitleVariant="caption"
          actions={<CloseButton />}
          embedded
        />

        <View style={styles.cameraViewport}>
          <CameraView
            ref={cameraRef}
            testID="scan-camera"
            style={styles.camera}
            facing="back"
            onBarcodeScanned={isScanningEnabled ? handleScan : undefined}
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
          {defaultView ? <ScanGuideOverlay view={defaultView} /> : null}
        </View>

        {saveError ? (
          <Text style={[styles.saveError, { color: theme.error }]}>
            {saveError}
          </Text>
        ) : null}

        {!isSaving ? (
          <Pressable
            onPress={() => {
              void openManualEntry();
            }}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <Text
              style={[styles.secondaryButtonText, { color: theme.textPrimary }]}
            >
              {t("enterManually")}
            </Text>
          </Pressable>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
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
  body: {
    gap: spacing.md,
  },
  cameraViewport: {
    width: "100%",
    height: "65%",
    maxHeight: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000000",
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  saveError: {
    ...typography.caption,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.bodySemibold,
  },
});
