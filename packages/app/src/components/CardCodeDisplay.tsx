import { Animated, Image, StyleSheet, Text, View } from "react-native";
import Barcode from "react-native-barcode-svg";
import QRCode from "react-native-qrcode-svg";

import { useCrossfadeProgress } from "@/hooks/useCrossfadeProgress";
import type { CardView } from "@/lib/cardView";
import { getReadableTextColor } from "@/lib/readableTextColor";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const QR_CODE_SIZE = 140;
const BARCODE_HEIGHT = 96;
const BARCODE_MAX_WIDTH = 300;
const BRAND_STRIP_LOGO_SIZE = 28;

type CardCodeDisplayProps = {
  cardNumber: string;
  view: CardView;
  borderColor: string;
  brand?: string;
  logoUrl?: string;
  backgroundColor?: string;
  bottomCardHalf?: boolean;
};

export const CardCodeDisplay = ({
  cardNumber,
  view,
  borderColor,
  brand,
  logoUrl,
  backgroundColor,
  bottomCardHalf,
}: CardCodeDisplayProps) => {
  const { theme } = useTheme();
  const isQr = view === "2D";
  const trimmedBrand = brand?.trim() ?? "";
  const trimmedLogoUrl = logoUrl?.trim() ?? "";
  const stripBackgroundColor = backgroundColor ?? theme.cardFallback;
  const stripTextColor = getReadableTextColor(stripBackgroundColor);
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
          borderTopWidth: bottomCardHalf ? 0 : undefined,
        },
      ]}
    >
      <View
        testID="brand-strip"
        style={[styles.brandStrip, { backgroundColor: stripBackgroundColor }]}
      >
        {trimmedLogoUrl ? (
          <Image
            source={{ uri: trimmedLogoUrl }}
            style={styles.brandStripLogo}
          />
        ) : null}
        {trimmedBrand ? (
          <Text
            numberOfLines={1}
            style={[styles.brandStripName, { color: stripTextColor }]}
          >
            {trimmedBrand}
          </Text>
        ) : null}
      </View>
      <View style={styles.codeBody}>
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
    overflow: "hidden",
  },
  brandStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brandStripLogo: {
    width: BRAND_STRIP_LOGO_SIZE,
    height: BRAND_STRIP_LOGO_SIZE,
    resizeMode: "contain",
  },
  brandStripName: {
    ...typography.bodySemibold,
    flex: 1,
  },
  codeBody: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
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
