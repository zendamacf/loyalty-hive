import type { StyleProp, TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";

import {
  APP_NAME,
  APP_NAME_ACCENT,
  APP_NAME_PREFIX,
} from "@/constants/branding.constants";
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
      accessibilityLabel={APP_NAME}
      accessibilityRole="header"
      style={[
        styles.title,
        { color: themeColors.textPrimary, textAlign: align },
        style,
      ]}
    >
      {APP_NAME_PREFIX}
      <Text style={styles.hive}>{APP_NAME_ACCENT}</Text>
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
