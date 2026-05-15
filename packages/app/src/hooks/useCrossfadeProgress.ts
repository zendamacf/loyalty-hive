import { useEffect, useRef } from "react";
import { Animated, Easing, type TransformsStyle } from "react-native";

export const CROSSFADE_MS = 220;

type UseCrossfadeProgressOptions = {
  useNativeDriver?: boolean;
  includeIconTransform?: boolean;
};

export function useCrossfadeProgress(
  active: boolean,
  options: UseCrossfadeProgressOptions = {},
) {
  const useNativeDriver = options.useNativeDriver ?? true;
  const includeIconTransform = options.includeIconTransform ?? true;
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: CROSSFADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [active, progress, useNativeDriver]);

  const opacityOff = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const opacityOn = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconTransform: TransformsStyle["transform"] | undefined =
    includeIconTransform
      ? [
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
        ]
      : undefined;

  return { progress, opacityOff, opacityOn, iconTransform };
}
