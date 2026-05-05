import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const LoyaltyCard = ({ brand, points, logo }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? "transparent" : colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Image source={{ uri: logo }} style={styles.logo} />
        <View>
          <Text style={[styles.brand, { color: colors.textPrimary }]}>
            {brand}
          </Text>
          <Text style={{ color: colors.textSecondary }}>{points}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: "600",
  },
});
