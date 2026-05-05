import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type ButtonProps = {
  title: string;
  onPress: () => void;
};

export const Button = ({ title, onPress }: ButtonProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: "#0D1B2A" }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
