import { spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";
import { MoonIcon, SunIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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

const ICON_SIZE = 24;
const TRANSITION_MS = 220;
const LABEL_SLOT_WIDTH = 60;

type ThemeToggleProps = {
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ThemeToggle = ({ showLabel = false, style }: ThemeToggleProps) => {
  const { t } = useTranslation("common");
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
      accessibilityLabel={isDark ? t("useLightTheme") : t("useDarkTheme")}
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
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.textPrimary }]}
              >
                {t("light")}
              </Text>
            </Animated.View>
            <Animated.View
              style={[styles.labelStacked, { opacity: moonOpacity }]}
            >
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.textPrimary }]}
              >
                {t("dark")}
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
    width: LABEL_SLOT_WIDTH,
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
