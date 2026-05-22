import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme/useTheme";

type ThemedRootProps = {
  children: ReactNode;
};

/** Fills the window behind edge-to-edge system UI (e.g. Android nav bar). */
export const ThemedRoot = ({ children }: ThemedRootProps) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
