import { XIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ActionSheet, { useSheetRef } from "react-native-actions-sheet";

import { icon, radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

type ActionSheetFrameProps = {
  title: string;
  closeAccessibilityLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

export const ActionSheetFrame = ({
  title,
  closeAccessibilityLabel,
  children,
  footer,
}: ActionSheetFrameProps) => {
  const { theme } = useTheme();
  const sheetRef = useSheetRef();

  const close = () => {
    sheetRef.current?.hide();
  };

  return (
    <ActionSheet
      gestureEnabled
      closeOnTouchBackdrop
      closeOnPressBack
      containerStyle={[
        styles.sheet,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
      indicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text>
          <Pressable
            accessibilityLabel={closeAccessibilityLabel}
            accessibilityRole="button"
            hitSlop={12}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={close}
          >
            <XIcon color={theme.textSecondary} size={icon.md} />
          </Pressable>
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(128, 128, 128, 0.35)",
    marginBottom: spacing.sm,
  },
  content: {
    alignSelf: "stretch",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    flex: 1,
  },
  closeButton: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.55,
  },
  body: {
    alignSelf: "stretch",
  },
  footer: {
    marginTop: spacing.lg,
  },
});
