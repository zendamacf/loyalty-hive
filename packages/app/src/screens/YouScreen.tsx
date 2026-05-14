import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../theme/useTheme";

/** Placeholder profile tab; content to be added later. */
export const YouScreen = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.root, { backgroundColor: colors.background }]}
    />
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
