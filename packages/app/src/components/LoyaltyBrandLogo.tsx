import { Image, StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/theme/theme";
import { useTheme } from "../theme/useTheme";

type Props = {
  brand: string;
  logo?: string;
  backgroundColor?: string;
  height: number;
};

export const LoyaltyBrandLogo = ({
  brand,
  logo,
  backgroundColor,
  height,
}: Props) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor, height }]}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.logo} />
      ) : (
        <View>
          <Text style={[styles.brand, { color: colors.textPrimary }]}>
            {brand}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    width: "100%",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  brand: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
