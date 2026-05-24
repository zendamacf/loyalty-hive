import type { ReactNode } from "react";
import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { fontSize, icon, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type SubtitleVariant = "subtitle" | "caption";
type SubtitlePlacement = "below" | "withTitle";

/** Room for bold 28px title glyphs without clipping. */
const TITLE_LINE_HEIGHT = Math.round(fontSize.title * 1.25);

export type ScreenHeaderProps = {
  /** Plain-text title. Ignored when `children` is provided. */
  title?: string;
  /** Custom title content (e.g. logo + AppTitle). */
  children?: ReactNode;
  subtitle?: string;
  subtitleVariant?: SubtitleVariant;
  subtitlePlacement?: SubtitlePlacement;
  /** Trailing actions (close button, menu, etc.). */
  actions?: ReactNode;
  /** Omit top padding when nested inside `ScreenShell.Body`. */
  embedded?: boolean;
  align?: "left" | "center";
  style?: StyleProp<ViewStyle>;
};

export const ScreenHeader = ({
  title,
  children,
  subtitle,
  subtitleVariant = "subtitle",
  subtitlePlacement = "below",
  actions,
  embedded = false,
  align = "left",
  style,
}: ScreenHeaderProps) => {
  const { theme } = useTheme();
  const hasSubtitle = Boolean(subtitle?.trim());
  const subtitleInTitle = hasSubtitle && subtitlePlacement === "withTitle";
  const subtitleBelow = hasSubtitle && subtitlePlacement === "below";
  const centered = align === "center";
  const actionInset = actions ? icon.md + spacing.sm : 0;

  const titleContent =
    children ??
    (title ? (
      <Text
        style={[
          styles.title,
          centered && styles.titleCentered,
          { color: theme.textPrimary },
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
    ) : null);

  return (
    <View
      style={[
        !embedded && styles.section,
        subtitleBelow && styles.sectionWithSubtitle,
        centered && styles.sectionCentered,
        style,
      ]}
    >
      <View style={[styles.titleRow, centered && styles.titleRowCentered]}>
        <View style={[styles.titleSlot, centered && styles.titleSlotCentered]}>
          {titleContent}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {subtitleInTitle ? (
        <Text
          style={[
            subtitleVariant === "caption" ? styles.caption : styles.subtitle,
            centered && styles.subtitleCentered,
            actionInset > 0 && { paddingRight: actionInset },
            { color: theme.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      {subtitleBelow ? (
        <Text
          style={[
            subtitleVariant === "caption" ? styles.caption : styles.subtitle,
            centered && styles.subtitleCentered,
            { color: theme.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: spacing.md,
  },
  sectionWithSubtitle: {
    gap: spacing.xs,
  },
  sectionCentered: {
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: Math.max(TITLE_LINE_HEIGHT, icon.md),
  },
  titleRowCentered: {
    justifyContent: "center",
  },
  titleSlot: {
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
    minHeight: TITLE_LINE_HEIGHT,
  },
  titleSlotCentered: {
    flex: 0,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    lineHeight: TITLE_LINE_HEIGHT,
    flexShrink: 1,
  },
  titleCentered: {
    textAlign: "center",
  },
  subtitle: {
    ...typography.subtitle,
  },
  caption: {
    ...typography.caption,
  },
  subtitleCentered: {
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing.xs,
    minHeight: icon.md,
  },
});
