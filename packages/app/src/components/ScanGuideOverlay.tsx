import { StyleSheet, View } from "react-native";

import type { CardView } from "@/lib/cardView";
import ScanGuideBarcode from "../../assets/scan-guides/barcode.svg";
import ScanGuideQrcode from "../../assets/scan-guides/qrcode.svg";
import { colors } from "../theme/theme";

const SCAN_GUIDE_BARCODE_WIDTH = 280;
const SCAN_GUIDE_BARCODE_HEIGHT = 120;
const SCAN_GUIDE_BARCODE_PLACEHOLDER_WIDTH = SCAN_GUIDE_BARCODE_WIDTH - 100;
const SCAN_GUIDE_BARCODE_PLACEHOLDER_HEIGHT = SCAN_GUIDE_BARCODE_HEIGHT - 10;
const SCAN_GUIDE_QRCODE_WIDTH = 139;
const SCAN_GUIDE_QRCODE_HEIGHT = 139;

const GUIDE_DIM = "rgba(0, 0, 0, 0.3)";
const GUIDE_CORNER_COLOR = colors.primary;
const GUIDE_PLACEHOLDER_OPACITY = 0.6;
const CORNER_SIZE = 22;
const CORNER_THICKNESS = 4;

type ScanGuideOverlayProps = {
  view: CardView;
};

const Corner = ({
  style,
}: {
  style: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
  };
}) => <View style={[styles.corner, style]} />;

const FakeBarcodeGuide = () => (
  <ScanGuideBarcode
    width={SCAN_GUIDE_BARCODE_PLACEHOLDER_WIDTH}
    height={SCAN_GUIDE_BARCODE_PLACEHOLDER_HEIGHT}
    opacity={GUIDE_PLACEHOLDER_OPACITY}
  />
);

const FakeQrGuide = () => (
  <ScanGuideQrcode
    width={SCAN_GUIDE_QRCODE_WIDTH}
    height={SCAN_GUIDE_QRCODE_HEIGHT}
    opacity={GUIDE_PLACEHOLDER_OPACITY}
  />
);

export const ScanGuideOverlay = ({ view }: ScanGuideOverlayProps) => {
  const isQr = view === "2D";

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      testID={isQr ? "scan-guide-2d" : "scan-guide-1d"}
    >
      <View style={styles.spacer} />
      <View style={styles.middleRow}>
        <View style={styles.side} />
        <View
          style={[styles.frame, isQr ? styles.frameQr : styles.frameBarcode]}
        >
          <Corner
            style={{
              top: 0,
              left: 0,
              borderTopWidth: CORNER_THICKNESS,
              borderLeftWidth: CORNER_THICKNESS,
            }}
          />
          <Corner
            style={{
              top: 0,
              right: 0,
              borderTopWidth: CORNER_THICKNESS,
              borderRightWidth: CORNER_THICKNESS,
            }}
          />
          <Corner
            style={{
              bottom: 0,
              left: 0,
              borderBottomWidth: CORNER_THICKNESS,
              borderLeftWidth: CORNER_THICKNESS,
            }}
          />
          <Corner
            style={{
              bottom: 0,
              right: 0,
              borderBottomWidth: CORNER_THICKNESS,
              borderRightWidth: CORNER_THICKNESS,
            }}
          />
          {isQr ? (
            <View style={styles.qrCodeGuideContainer}>
              <FakeQrGuide />
            </View>
          ) : (
            <View style={styles.barcodeGuideContainer}>
              <FakeBarcodeGuide />
            </View>
          )}
        </View>
        <View style={styles.side} />
      </View>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  spacer: {
    flex: 1,
    backgroundColor: GUIDE_DIM,
  },
  middleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: GUIDE_DIM,
  },
  frame: {
    position: "relative",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  frameBarcode: {
    width: SCAN_GUIDE_BARCODE_WIDTH,
    height: SCAN_GUIDE_BARCODE_HEIGHT,
  },
  frameQr: {
    width: 240,
    height: 240,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: GUIDE_CORNER_COLOR,
  },
  qrCodeGuideContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeGuideContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
