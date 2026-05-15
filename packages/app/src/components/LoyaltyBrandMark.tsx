import { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

import { TRANSITION_MS } from "@/constants/ui.constants";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type Props = {
  brand: string;
  logo?: string;
  backgroundColor?: string;
  height: number;
  animateHeight?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const LoyaltyBrandMark = ({
  brand,
  logo,
  backgroundColor,
  height,
  animateHeight = false,
  style,
}: Props) => {
  const { colors } = useTheme();
  const animatedHeight = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (!animateHeight) {
      return;
    }

    Animated.timing(animatedHeight, {
      toValue: height,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animateHeight, animatedHeight, height]);

  const card = (
    <View style={[styles.card, { backgroundColor }]}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.logo} />
      ) : (
        <Text style={[styles.brand, { color: colors.textPrimary }]}>
          {brand}
        </Text>
      )}
    </View>
  );

  if (!animateHeight) {
    return <View style={[styles.shell, { height }, style]}>{card}</View>;
  }

  return (
    <Animated.View style={[styles.shell, style, { height: animatedHeight }]}>
      {card}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    overflow: "hidden",
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
