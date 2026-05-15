import { useTranslation } from "react-i18next";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { radius, spacing, typography } from "../theme/theme";
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
  const { t } = useTranslation("common");
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
            accessibilityLabel={t("clearSearch")}
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
    ...typography.body,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  clearLabel: {
    ...typography.clearIcon,
    lineHeight: 24,
  },
});
