import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export const SearchBar = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TextInput
        placeholder="Search cards..."
        placeholderTextColor={colors.textSecondary}
        style={{ color: colors.textPrimary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
