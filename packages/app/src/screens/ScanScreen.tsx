import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const ScanScreen = () => {
  const { t } = useTranslation(I18nNamespace.Scan);
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    brandName?: string;
    brandId?: string;
    label?: string;
    defaultView?: CardView;
  }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const selectedBrandId =
    typeof params.brandId === "string" ? params.brandId : null;
  const customLabel =
    typeof params.label === "string" ? params.label.trim() : null;
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

  const hasHeaderContext = Boolean(
    (selectedBrandId && selectedBrandName) || (!selectedBrandId && customLabel),
  );

  const [permission, requestPermission] = useCameraPermissions();
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
    return isSaving ? t("savingCard") : scanPrompt;
  }, [
    customLabel,
    isSaving,
    scanPrompt,
    selectedBrandId,
    selectedBrandName,
    t,
  ]);

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

  const openManualEntry = useCallback(() => {
    router.push({
      pathname: Routes.SCAN_MANUAL_ENTRY,
      params: {
        ...(selectedBrandId ? { brandId: selectedBrandId } : {}),
        ...(selectedBrandName ? { brandName: selectedBrandName } : {}),
        ...(customLabel ? { label: customLabel } : {}),
      },
    });
  }, [customLabel, selectedBrandId, selectedBrandName]);

  if (!permission) {
    return (
      <ScreenShell style={styles.permissionContainer}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
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
            testID="scan-camera"
            style={styles.camera}
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
          {defaultView ? <ScanGuideOverlay view={defaultView} /> : null}
        </View>

        {saveError ? (
          <Text style={[styles.saveError, { color: colors.error }]}>
            {saveError}
          </Text>
        ) : null}

        {!isSaving ? (
          <Pressable
            onPress={openManualEntry}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.textPrimary },
              ]}
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
