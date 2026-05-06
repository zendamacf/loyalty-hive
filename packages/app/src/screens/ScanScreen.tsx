import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type CapturedCode = {
  type: string;
  data: string;
};

export const ScanScreen = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ brandName?: string }>();
  const selectedBrandName =
    typeof params.brandName === "string" ? params.brandName : null;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<CapturedCode | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanResult) {
      return;
    }

    setScanResult({ type: result.type, data: result.data });
  };

  const submitManualCode = () => {
    const normalizedCode = manualCode.trim();
    if (!normalizedCode) {
      return;
    }

    setScanResult({ type: "manual", data: normalizedCode });
    setIsManualEntryOpen(false);
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Checking camera permissions...
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
          Camera access needed
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Allow camera permission to scan QR codes and barcodes.
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#000000" }]}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanResult ? undefined : handleScan}
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
            Adding card for {selectedBrandName}
          </Text>
        ) : null}
        <Text style={styles.overlayTitle}>
          {scanResult ? "Code captured" : "Scan a loyalty card QR or barcode"}
        </Text>

        {!scanResult ? (
          <View style={styles.manualEntryWrapper}>
            <Pressable
              onPress={() => setIsManualEntryOpen((current) => !current)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {isManualEntryOpen
                  ? "Close manual entry"
                  : "Enter card number manually"}
              </Text>
            </Pressable>

            {isManualEntryOpen ? (
              <View style={styles.manualEntryFields}>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="Card number"
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
                  <Text style={styles.primaryButtonText}>Use card number</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {scanResult ? (
          <View style={styles.resultPanel}>
            <Text style={styles.resultText}>Type: {scanResult.type}</Text>
            <Text numberOfLines={2} style={styles.resultText}>
              Value: {scanResult.data}
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => setScanResult(null)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Scan again</Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "600",
  },
  brandTag: {
    color: "#E2E8F0",
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  resultPanel: {
    marginTop: spacing.sm,
    gap: spacing.xs,
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
    fontSize: 16,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  resultText: {
    color: "#E2E8F0",
    fontSize: 14,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
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
    fontWeight: "600",
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
    fontWeight: "700",
  },
});
