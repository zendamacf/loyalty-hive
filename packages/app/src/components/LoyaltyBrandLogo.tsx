import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { radius } from "@/theme/theme";
import { useTheme } from "../theme/useTheme";
import { LoyaltyBrandMark } from "./LoyaltyBrandMark";

type Props = {
  brand: string;
  accessibilityLabel?: string;
  logo?: string;
  backgroundColor?: string;
  height: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const LoyaltyBrandLogo = ({
  brand,
  accessibilityLabel,
  logo,
  backgroundColor,
  height,
  onPress,
  style,
}: Props) => {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);

  const cardBody = (pressed: boolean) => (
    <View style={styles.cardWrap}>
      <LoyaltyBrandMark
        brand={brand}
        logo={logo}
        backgroundColor={backgroundColor}
        height={height}
      />
      {pressed ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.touchHighlight,
            {
              borderRadius: radius.sm,
              backgroundColor: theme.touchHighlight,
            },
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? brand}
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
  cardWrap: {
    width: "100%",
    position: "relative",
  },
  touchHighlight: {
    borderCurve: "continuous",
  },
});
