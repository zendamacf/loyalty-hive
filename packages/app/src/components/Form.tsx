import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { spacing } from "@/theme/theme";

export type FormProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Even vertical spacing between {@link FormGroup} children. */
export const Form = ({ children, style }: FormProps) => (
  <View style={[styles.root, style]}>{children}</View>
);

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
});
