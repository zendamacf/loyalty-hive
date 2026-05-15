import { Animated, StyleSheet, View } from "react-native";
import Barcode from "react-native-barcode-svg";
import QRCode from "react-native-qrcode-svg";

import { useCrossfadeProgress } from "@/hooks/useCrossfadeProgress";
import type { CardView } from "@/lib/cardView";
import { radius, spacing } from "@/theme/theme";

const QR_CODE_SIZE = 280;
const BARCODE_HEIGHT = 96;
const BARCODE_MAX_WIDTH = 280;

type CardCodeDisplayProps = {
  cardNumber: string;
  view: CardView;
  borderColor: string;
  bottomCardHalf?: boolean;
};

export const CardCodeDisplay = ({
  cardNumber,
  view,
  borderColor,
  bottomCardHalf,
}: CardCodeDisplayProps) => {
  const isQr = view === "2D";
  const { progress, opacityOff, opacityOn } = useCrossfadeProgress(isQr, {
    useNativeDriver: false,
    includeIconTransform: false,
  });

  const slotHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [BARCODE_HEIGHT, QR_CODE_SIZE],
  });

  return (
    <View
      style={[
        styles.codePanel,
        {
          borderColor,
          borderTopLeftRadius: bottomCardHalf ? 0 : undefined,
          borderTopRightRadius: bottomCardHalf ? 0 : undefined,
        },
      ]}
    >
      <Animated.View style={[styles.codeSlot, { height: slotHeight }]}>
        <Animated.View
          pointerEvents={isQr ? "none" : "auto"}
          style={[styles.codeLayer, { opacity: opacityOff }]}
        >
          <View testID="barcode">
            <Barcode
              value={cardNumber}
              format="CODE128"
              singleBarWidth={2}
              height={BARCODE_HEIGHT}
              maxWidth={BARCODE_MAX_WIDTH}
            />
          </View>
        </Animated.View>
        <Animated.View
          pointerEvents={isQr ? "auto" : "none"}
          style={[styles.codeLayer, { opacity: opacityOn }]}
        >
          <QRCode testID="qrcode" value={cardNumber} size={QR_CODE_SIZE} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  codePanel: {
    alignSelf: "stretch",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  codeSlot: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  codeLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
