import { StyleSheet, View } from "react-native";

import type { Theme } from "@/theme/types";

export type ThemeColorCircleProps = {
  theme: Theme;
  size: number;
  testID?: string;
};

export const ThemeColorCircle = ({
  theme,
  size,
  testID,
}: ThemeColorCircleProps) => (
  <View
    testID={testID}
    style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
      },
    ]}
  />
);

const styles = StyleSheet.create({
  circle: {
    flexShrink: 0,
  },
});
