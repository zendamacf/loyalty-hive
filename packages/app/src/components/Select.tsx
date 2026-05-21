import { ChevronDownIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { icon, radius, spacing, transition, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export type SelectProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type MenuAnchor = {
  x: number;
  y: number;
  width: number;
};

export const Select = <T extends string>({
  value,
  onValueChange,
  options,
  accessibilityLabel,
  disabled = false,
  style,
}: SelectProps<T>) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [modalShown, setModalShown] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const triggerRef = useRef<View>(null);
  const chevronFlip = useRef(new Animated.Value(0)).current;
  const menuExpand = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronFlip, {
      toValue: open ? 1 : 0,
      duration: transition.ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chevronFlip, open]);

  useEffect(() => {
    if (!modalShown) {
      return;
    }
    Animated.timing(menuExpand, {
      toValue: open ? 1 : 0,
      duration: transition.ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) {
        setModalShown(false);
        setMenuAnchor(null);
        setMenuHeight(0);
      }
    });
  }, [menuExpand, modalShown, open]);

  const chevronStyle = {
    transform: [
      {
        scaleY: chevronFlip.interpolate({
          inputRange: [0, 1],
          outputRange: [1, -1],
        }),
      },
    ],
  };

  const menuCollapseStyle = {
    opacity: menuExpand.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 1],
    }),
    transform: [
      {
        translateY: menuExpand.interpolate({
          inputRange: [0, 1],
          outputRange: [-menuHeight / 2, 0],
        }),
      },
      { scaleY: menuExpand },
    ],
  };

  const backdropOpacity = menuExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const close = () => {
    setOpen(false);
  };

  const onMenuLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0 && nextHeight !== menuHeight) {
      setMenuHeight(nextHeight);
    }
  };

  const toggle = () => {
    if (disabled) {
      return;
    }
    if (open) {
      close();
      return;
    }
    setOpen(true);
    setModalShown(true);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({
        x,
        y: y + height + spacing.xs,
        width,
      });
    });
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={[styles.root, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled, expanded: open }}
          accessibilityValue={{ text: selectedOption?.label }}
          disabled={disabled}
          onPress={toggle}
          style={({ pressed }) => [
            styles.trigger,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
            pressed && !disabled && styles.triggerPressed,
            disabled && styles.triggerDisabled,
          ]}
        >
          <Text
            style={[styles.triggerLabel, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {selectedOption?.label ?? ""}
          </Text>
          <Animated.View style={[styles.chevron, chevronStyle]}>
            <ChevronDownIcon color={colors.textSecondary} size={icon.md} />
          </Animated.View>
        </Pressable>
      </View>

      <Modal
        visible={modalShown && menuAnchor !== null}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={styles.backdropPressable} onPress={close} />
        </Animated.View>
        {menuAnchor ? (
          <Animated.View
            style={[
              styles.menu,
              menuCollapseStyle,
              {
                top: menuAnchor.y,
                left: menuAnchor.x,
                width: menuAnchor.width,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.textPrimary,
              },
            ]}
          >
            <View onLayout={onMenuLayout} style={styles.menuContent}>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => {
                      onValueChange(option.value);
                      close();
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                        {
                          color: selected ? colors.primary : colors.textPrimary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 140,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerLabel: {
    flex: 1,
    ...typography.body,
  },
  chevron: {
    width: icon.md,
    height: icon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdropPressable: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  menuContent: {
    width: "100%",
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    ...typography.body,
  },
  optionLabelSelected: {
    ...typography.bodySemibold,
  },
});
