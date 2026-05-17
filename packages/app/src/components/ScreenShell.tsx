import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type ScreenShellProps = {
  children: ReactNode;
  /** Pinned below main content (settings sign-out, delete card). */
  footer?: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

type ScreenShellBodyProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const ScreenShellBody = ({ children, style }: ScreenShellBodyProps) => (
  <View style={[styles.body, style]}>{children}</View>
);

export const ScreenShell = ({
  children,
  footer,
  edges,
  style,
}: ScreenShellProps) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.shell,
        footer != null && styles.shellWithFooter,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      {children}
      {footer}
    </SafeAreaView>
  );
};

ScreenShell.Body = ScreenShellBody;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  shellWithFooter: {
    paddingBottom: spacing.lg,
  },
  body: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
});
