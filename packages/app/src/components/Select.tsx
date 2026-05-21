import { ChevronDownIcon } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  BackHandler,
  Easing,
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useOverlay } from "@/components/OverlayProvider";
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
  const { layerRef, setOverlay } = useOverlay();
  const [open, setOpen] = useState(false);
  const [overlayShown, setOverlayShown] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const triggerRef = useRef<View>(null);
  const prevOpenRef = useRef(false);
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
    if (!overlayShown) {
      prevOpenRef.current = false;
      return;
    }
    if (menuAnchor == null) {
      return;
    }

    const opening = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (opening) {
      menuExpand.setValue(0);
    }

    Animated.timing(menuExpand, {
      toValue: open ? 1 : 0,
      duration: transition.ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !open) {
        setOverlayShown(false);
        setMenuAnchor(null);
        setMenuHeight(0);
        prevOpenRef.current = false;
      }
    });
  }, [menuAnchor, menuExpand, open, overlayShown]);

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

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const onMenuLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setMenuHeight((prev) => {
      if (nextHeight > 0 && nextHeight !== prev) {
        return nextHeight;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        close();
        return true;
      },
    );
    return () => subscription.remove();
  }, [close, open]);

  const updateMenuAnchor = useCallback(() => {
    const layer = layerRef.current;
    const trigger = triggerRef.current;
    if (layer == null || trigger == null) {
      return;
    }

    const setAnchor = (x: number, y: number, width: number, height: number) => {
      setMenuAnchor({
        x,
        y: y + height + spacing.xs,
        width,
      });
    };

    trigger.measureLayout(
      layer,
      setAnchor,
      () => {
        layer.measureInWindow((layerX, layerY) => {
          trigger.measureInWindow((x, y, width, height) => {
            setAnchor(x - layerX, y - layerY, width, height);
          });
        });
      },
    );
  }, [layerRef]);

  useLayoutEffect(() => {
    if (!overlayShown) {
      return;
    }
    updateMenuAnchor();
    const timeout = setTimeout(updateMenuAnchor, 0);
    return () => clearTimeout(timeout);
  }, [overlayShown, updateMenuAnchor]);

  useEffect(() => {
    if (!overlayShown) {
      setOverlay(null);
    }
  }, [overlayShown, setOverlay]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: menuCollapseStyle is a new object each render; menuHeight drives layout updates.
  useEffect(() => {
    if (!overlayShown || menuAnchor == null) {
      return;
    }

    setOverlay(
      <View style={styles.overlayRoot} pointerEvents="box-none">
        <Pressable style={styles.dismissLayer} onPress={close} />
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
      </View>,
    );
  }, [
    close,
    colors.border,
    colors.primary,
    colors.surface,
    colors.textPrimary,
    menuAnchor,
    menuHeight,
    onMenuLayout,
    onValueChange,
    options,
    overlayShown,
    setOverlay,
    value,
  ]);

  const toggle = () => {
    if (disabled) {
      return;
    }
    if (open) {
      close();
      return;
    }
    setOpen(true);
    setOverlayShown(true);
  };

  return (
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
  overlayRoot: {
    flex: 1,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
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
