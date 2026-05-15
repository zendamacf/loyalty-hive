import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "../theme/useTheme";

type Props = {
  brand: string;
  logo?: string;
  backgroundColor?: string;
  height: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const LoyaltyBrandLogo = ({
  brand,
  logo,
  backgroundColor,
  height,
  onPress,
  style,
}: Props) => {
  const { colors, isDark } = useTheme();
  const [pressed, setPressed] = useState(false);

  const content = logo ? (
    <Image source={{ uri: logo }} style={styles.logo} />
  ) : (
    <View>
      <Text style={[styles.brand, { color: colors.textPrimary }]}>{brand}</Text>
    </View>
  );

  const cardBody = (pressed: boolean) => (
    <View style={[styles.card, { backgroundColor, height }]}>
      {content}
      {pressed ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.touchHighlight,
            {
              borderRadius: radius.sm,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.14)"
                : "rgba(15, 23, 42, 0.1)",
            },
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={brand}
      accessibilityRole="button"
      style={style}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        setPressed(false);
        onPress();
      }}
    >
      {cardBody(pressed)}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  touchHighlight: {
    borderCurve: "continuous",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  brand: {
    ...typography.bodySemibold,
    textAlign: "center",
  },
});
