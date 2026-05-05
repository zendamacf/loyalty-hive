import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme/theme";

type FABProps = {
  onPress: () => void;
};

export const FAB = ({ onPress }: FABProps) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Text style={styles.plus}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  plus: {
    fontSize: 24,
    color: "#0D1B2A",
  },
});
