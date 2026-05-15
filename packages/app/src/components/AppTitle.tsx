import type { StyleProp, TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";

import { colors, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type AppTitleProps = {
  align?: "left" | "center";
  style?: StyleProp<TextStyle>;
};

export const AppTitle = ({ align = "center", style }: AppTitleProps) => {
  const { colors: themeColors } = useTheme();

  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.title,
        { color: themeColors.textPrimary, textAlign: align },
        style,
      ]}
    >
      Loyalty<Text style={styles.hive}>Hive</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    ...typography.title,
  },
  hive: {
    color: colors.primary,
  },
});
