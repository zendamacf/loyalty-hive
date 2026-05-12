import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export const Button = ({ title, onPress, disabled = false }: ButtonProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        disabled && styles.buttonDisabled,
      ]}
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
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
