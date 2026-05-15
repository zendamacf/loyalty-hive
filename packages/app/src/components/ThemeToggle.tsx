import { MoonIcon, SunIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useCrossfadeProgress } from "@/hooks/useCrossfadeProgress";
import { I18nNamespace } from "@/i18n/i18n.constants";
import { icon, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const LABEL_SLOT_WIDTH = 60;

type ThemeToggleProps = {
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ThemeToggle = ({ showLabel = false, style }: ThemeToggleProps) => {
  const { t } = useTranslation(I18nNamespace.Common);
  const { colors, isDark, setThemeMode } = useTheme();
  const { opacityOff, opacityOn, iconTransform } = useCrossfadeProgress(isDark);

  const icons = (
    <View style={styles.iconSlot}>
      <Animated.View
        style={[
          styles.iconLayer,
          { opacity: opacityOff, transform: iconTransform },
        ]}
      >
        <SunIcon color={colors.textPrimary} size={icon.md} />
      </Animated.View>
      <Animated.View
        style={[
          styles.iconLayer,
          { opacity: opacityOn, transform: iconTransform },
        ]}
      >
        <MoonIcon color={colors.textPrimary} size={icon.md} />
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
              style={[styles.labelStacked, { opacity: opacityOff }]}
            >
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.textPrimary }]}
              >
                {t("light")}
              </Text>
            </Animated.View>
            <Animated.View
              style={[styles.labelStacked, { opacity: opacityOn }]}
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
    width: icon.md,
    height: icon.md,
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
