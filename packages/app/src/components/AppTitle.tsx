import type { StyleProp, TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";

import {
  APP_NAME,
  APP_NAME_ACCENT,
  APP_NAME_PREFIX,
} from "@/constants/branding.constants";
import { brandColors } from "@/theme/brand";
import { typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type AppTitleProps = {
  align?: "left" | "center";
  style?: StyleProp<TextStyle>;
};

export const AppTitle = ({ align = "center", style }: AppTitleProps) => {
  const { theme } = useTheme();

  return (
    <Text
      accessibilityLabel={APP_NAME}
      accessibilityRole="header"
      style={[
        styles.title,
        { color: theme.textPrimary, textAlign: align },
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
    color: brandColors.primary,
  },
});
