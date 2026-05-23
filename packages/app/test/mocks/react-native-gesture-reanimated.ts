import { mock } from "bun:test";
import React from "react";

mock.module("react-native-gesture-handler", () => {
  const GestureHandlerRootView = ({
    children,
    style,
  }: {
    children?: React.ReactNode;
    style?: object;
  }) => React.createElement("View", { style }, children);

  return {
    GestureHandlerRootView,
    Gesture: {
      Pan: () => ({
        enabled: () => ({}),
        onChange: () => ({}),
        onEnd: () => ({}),
      }),
    },
    State: {},
  };
});

mock.module("react-native-reanimated", () => {
  const NOOP = () => {};

  const AnimatedView = React.forwardRef(function AnimatedView(
    props: Record<string, unknown>,
    ref: React.Ref<unknown>,
  ) {
    return React.createElement(
      "View",
      { ...props, ref },
      props.children as React.ReactNode,
    );
  });

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      createAnimatedComponent: (component: React.ComponentType) => component,
    },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (factory: () => object) => factory(),
    useAnimatedReaction: NOOP,
    useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
    runOnJS: (fn: () => void) => fn,
    interpolate: (
      _value: number,
      _input: number[],
      output: (number | string)[],
    ) => output[output.length - 1],
    Extrapolation: { CLAMP: "clamp" },
    Easing: {
      linear: (value: number) => value,
      out: (easing: (value: number) => number) => easing,
      cubic: (value: number) => value,
    },
  };
});
