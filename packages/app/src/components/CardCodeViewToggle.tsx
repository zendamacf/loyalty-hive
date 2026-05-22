import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useCrossfadeProgress } from "@/hooks/useCrossfadeProgress";
import { I18nNamespace } from "@/i18n/i18n.constants";
import type { CardView } from "@/lib/cardView";
import { getReadableTextColor } from "@/lib/readableTextColor";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

const TRACK_INSET = spacing.xs / 2;
const TRACK_MAX_WIDTH = 320;

type CardCodeViewToggleProps = {
  view: CardView;
  onToggle: () => void;
  /** Brand card color for the active segment; falls back to theme primary. */
  activeSegmentColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const CardCodeViewToggle = ({
  view,
  onToggle,
  activeSegmentColor,
  style,
}: CardCodeViewToggleProps) => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const isQr = view === "2D";
  const segmentFillColor = useMemo(() => {
    const trimmed = activeSegmentColor?.trim();
    return trimmed ? trimmed : theme.primary;
  }, [activeSegmentColor, theme.primary]);
  const segmentTextColor = useMemo(
    () => getReadableTextColor(segmentFillColor),
    [segmentFillColor],
  );
  const [segmentWidth, setSegmentWidth] = useState(0);
  const { progress } = useCrossfadeProgress(isQr, {
    useNativeDriver: true,
    includeIconTransform: false,
  });

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  const onSegmentsLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const nextSegmentWidth = width / 2;
    setSegmentWidth((current) =>
      Math.abs(current - nextSegmentWidth) < 0.5 ? current : nextSegmentWidth,
    );
  }, []);

  const selectView = useCallback(
    (useQr: boolean) => {
      const nextView: CardView = useQr ? "2D" : "1D";
      if (nextView !== view) {
        onToggle();
      }
    },
    [onToggle, view],
  );

  return (
    <View
      accessibilityLabel={t("codeViewToggleA11y")}
      accessibilityRole="radiogroup"
      style={[styles.track, { backgroundColor: theme.border }, style]}
      testID="code-view-switch"
    >
      <View style={styles.inner} onLayout={onSegmentsLayout}>
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                width: segmentWidth,
                backgroundColor: segmentFillColor,
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          />
        ) : null}
        <View style={styles.segments}>
          <Pressable
            accessibilityLabel={t("codeViewBarcode")}
            accessibilityRole="radio"
            accessibilityState={{ selected: !isQr }}
            style={({ pressed }) => [
              styles.segment,
              pressed && styles.segmentPressed,
            ]}
            onPress={() => selectView(false)}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: !isQr ? segmentTextColor : theme.textSecondary,
                },
                !isQr && styles.segmentLabelSelected,
              ]}
            >
              {t("codeViewBarcode")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("codeViewQr")}
            accessibilityRole="radio"
            accessibilityState={{ selected: isQr }}
            style={({ pressed }) => [
              styles.segment,
              pressed && styles.segmentPressed,
            ]}
            onPress={() => selectView(true)}
          >
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: isQr ? segmentTextColor : theme.textSecondary,
                },
                isQr && styles.segmentLabelSelected,
              ]}
            >
              {t("codeViewQr")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: TRACK_MAX_WIDTH,
    borderRadius: radius.xl,
    padding: TRACK_INSET,
  },
  inner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.xl - TRACK_INSET,
  },
  thumb: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.xl - TRACK_INSET,
  },
  segments: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  segmentLabel: {
    ...typography.label,
    textAlign: "center",
  },
  segmentLabelSelected: {
    fontWeight: typography.bodySemibold.fontWeight,
  },
});
