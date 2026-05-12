import type { StyleProp, TextInputProps, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
};

export const SearchBar = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
  style,
  autoCapitalize,
  autoCorrect,
}: SearchBarProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface }, style]}>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.textPrimary }]}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => onChangeText("")}
            style={styles.clearButton}
          >
            <Text style={[styles.clearLabel, { color: colors.textSecondary }]}>
              ×
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  clearLabel: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "400",
  },
});
