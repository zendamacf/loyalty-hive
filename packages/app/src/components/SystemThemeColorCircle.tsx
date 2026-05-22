import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";

import { darkTheme, lightTheme } from "@/theme/themes";

export type SystemThemeColorCircleProps = {
  size: number;
  testID?: string;
};

/** Light top-left / dark bottom-right, split on a 45° diagonal. */
export const SystemThemeColorCircle = ({
  size,
  testID,
}: SystemThemeColorCircleProps) => {
  const radius = size / 2;
  const strokeWidth = 1;
  const innerRadius = radius - strokeWidth / 2;
  const clipId = `system-theme-swatch-${size}`;

  return (
    <View
      testID={testID}
      style={[styles.container, { width: size, height: size }]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={radius} cy={radius} r={innerRadius} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Path
            d={`M 0 0 L ${size} 0 L 0 ${size} Z`}
            fill={lightTheme.background}
          />
          <Path
            d={`M ${size} ${size} L ${size} 0 L 0 ${size} Z`}
            fill={darkTheme.background}
          />
        </G>
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="none"
          stroke={lightTheme.border}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
  },
});
