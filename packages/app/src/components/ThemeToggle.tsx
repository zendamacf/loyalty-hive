import { MoonIcon, SunIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const ICON_SIZE = 24;
const TRANSITION_MS = 220;

type ThemeToggleProps = {
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ThemeToggle = ({ showLabel = false, style }: ThemeToggleProps) => {
  const { colors, isDark, setThemeMode } = useTheme();
  const progress = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isDark ? 1 : 0,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isDark, progress]);

  const sunOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const moonOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const iconTransform = [
    {
      rotate: progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["180deg", "0deg"],
      }),
    },
    {
      scale: progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.82, 1],
      }),
    },
  ];

  const icons = (
    <View style={styles.iconSlot}>
      <Animated.View
        style={[
          styles.iconLayer,
          { opacity: sunOpacity, transform: iconTransform },
        ]}
      >
        <SunIcon color={colors.textPrimary} size={ICON_SIZE} />
      </Animated.View>
      <Animated.View
        style={[
          styles.iconLayer,
          { opacity: moonOpacity, transform: iconTransform },
        ]}
      >
        <MoonIcon color={colors.textPrimary} size={ICON_SIZE} />
      </Animated.View>
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={isDark ? "Use light theme" : "Use dark theme"}
      accessibilityRole="button"
      hitSlop={12}
      style={[styles.pressable, style]}
      onPress={() => setThemeMode(isDark ? "light" : "dark")}
    >
      {showLabel ? (
        <View style={styles.content}>
          {icons}
          <View style={styles.labelSlot}>
            <Animated.View
              style={[styles.labelStacked, { opacity: sunOpacity }]}
            >
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Light
              </Text>
            </Animated.View>
            <Animated.View
              style={[styles.labelStacked, { opacity: moonOpacity }]}
            >
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Dark
              </Text>
            </Animated.View>
          </View>
        </View>
      ) : (
        icons
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    padding: spacing.xs,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  labelSlot: {
    minWidth: 36,
    height: typography.label.fontSize * 1.25,
    justifyContent: "center",
  },
  label: {
    ...typography.label,
  },
  labelStacked: {
    position: "absolute",
    left: 0,
  },
});
