import { mock } from "bun:test";
import React from "react";

import "./mocks/api-client";

const asyncStorage = new Map<string, string>();

mock.module("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => asyncStorage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      asyncStorage.set(key, value);
    },
    removeItem: async (key: string) => {
      asyncStorage.delete(key);
    },
    clear: async () => {
      asyncStorage.clear();
    },
  },
}));

/// This is a bunch of mocks to allow testing of React Native components.
/// TODO: There must be a better solution for this.

const expoRouterMocks = {
  push: mock(() => {}),
  back: mock(() => {}),
  dismissTo: mock(() => {}),
  replace: mock(() => {}),
  params: {} as Record<string, string | undefined>,
};

Object.assign(globalThis, { __expoRouterMocks: expoRouterMocks });

function createPrimitive(name: string) {
  const Primitive = (props: Record<string, unknown>) =>
    React.createElement(name, props, props.children as React.ReactNode);
  Primitive.displayName = name;
  return Primitive;
}

class AnimatedValue {
  _value: number;

  constructor(initial: number) {
    this._value = initial;
  }

  interpolate(config: {
    inputRange: number[];
    outputRange: (number | string)[];
  }) {
    const { inputRange, outputRange } = config;
    if (this._value <= inputRange[0]) {
      return outputRange[0];
    }
    if (this._value >= inputRange[inputRange.length - 1]) {
      return outputRange[outputRange.length - 1];
    }
    return outputRange[outputRange.length - 1];
  }
}

const Animated = {
  Value: AnimatedValue,
  View: createPrimitive("Animated.View"),
  timing: (
    value: AnimatedValue,
    config: { toValue: number; duration?: number; useNativeDriver?: boolean },
  ) => ({
    start: (callback?: (result: { finished: boolean }) => void) => {
      value._value = config.toValue;
      callback?.({ finished: true });
    },
  }),
};

const Easing = {
  out: (easing: (value: number) => number) => easing,
  cubic: (value: number) => value,
};

mock.module("lucide-react-native", () => ({
  MoonIcon: () => React.createElement("Text", null, "moon"),
  SunIcon: () => React.createElement("Text", null, "sun"),
  PlusIcon: () => React.createElement("Text", null, "+"),
  SettingsIcon: () => React.createElement("Text", null, "⚙"),
}));

mock.module("react-native", () => ({
  FlatList: (props: {
    data: Array<Record<string, unknown>>;
    renderItem: (item: {
      item: Record<string, unknown>;
      index: number;
    }) => React.ReactNode;
    ListEmptyComponent?: React.ReactNode | React.ComponentType;
    refreshControl?: React.ReactNode;
  }) => {
    const rows =
      props.data.length === 0 && props.ListEmptyComponent != null
        ? [
            React.createElement(
              React.Fragment,
              { key: "list-empty" },
              typeof props.ListEmptyComponent === "function"
                ? React.createElement(
                    props.ListEmptyComponent as React.ComponentType,
                  )
                : (props.ListEmptyComponent as React.ReactNode),
            ),
          ]
        : props.data.map((item, index) =>
            React.createElement(
              React.Fragment,
              { key: `${index}-${String(item.id ?? "row")}` },
              props.renderItem({ item, index }),
            ),
          );

    return React.createElement(
      "FlatList",
      props,
      props.refreshControl,
      ...rows,
    );
  },
  RefreshControl: createPrimitive("RefreshControl"),
  Pressable: (props: {
    disabled?: boolean;
    onPress?: () => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { onPress, disabled, children, ...rest } = props;
    return React.createElement(
      "Pressable",
      {
        ...rest,
        disabled,
        ...(disabled ? {} : { onPress }),
      },
      children,
    );
  },
  ActivityIndicator: createPrimitive("ActivityIndicator"),
  StyleSheet: {
    create: (styles: object) => styles,
    flatten: (style: unknown) => style,
    absoluteFill: {},
    absoluteFillObject: {},
  },
  Text: createPrimitive("Text"),
  TouchableOpacity: (props: {
    disabled?: boolean;
    onPress?: () => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const { onPress, disabled, children, ...rest } = props;
    return React.createElement(
      "TouchableOpacity",
      {
        ...rest,
        disabled,
        ...(disabled ? {} : { onPress }),
      },
      children,
    );
  },
  View: createPrimitive("View"),
  TextInput: createPrimitive("TextInput"),
  Image: createPrimitive("Image"),
  Animated,
  Easing,
  useColorScheme: () => "light",
}));

mock.module("react-native-safe-area-context", () => ({
  SafeAreaView: createPrimitive("SafeAreaView"),
}));

mock.module("@react-navigation/native", () => ({
  useFocusEffect: (effect: () => undefined | (() => void)) => {
    React.useEffect(() => {
      const cleanup = effect();
      return typeof cleanup === "function" ? cleanup : undefined;
    }, [effect]);
  },
}));

mock.module("expo-router", () => ({
  router: {
    push: (arg: unknown) =>
      (expoRouterMocks.push as unknown as (value: unknown) => void)(arg),
    back: () => expoRouterMocks.back(),
    dismissTo: (arg: unknown) =>
      (expoRouterMocks.dismissTo as unknown as (value: unknown) => void)(arg),
    replace: (arg: unknown) =>
      (expoRouterMocks.replace as unknown as (value: unknown) => void)(arg),
  },
  useLocalSearchParams: () => expoRouterMocks.params,
}));
