import type { ReactNode } from "react";
import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export type FormGroupProps = {
  label: string;
  children: ReactNode;
  /** Optional helper text shown between the label and control. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export const FormGroup = ({ label, children, hint, style }: FormGroupProps) => {
  const { theme } = useTheme();

  return (
    <View style={style}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      {hint && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {hint}
        </Text>
      )}
      <View style={styles.control}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.label,
  },
  hint: {
    ...typography.labelHint,
    marginTop: -spacing.xxs,
  },
  control: {
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },
});
