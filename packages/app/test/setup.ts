import { mock } from "bun:test";
import React from "react";

import "./mocks/api-client";
import "./mocks/expo-localization";
import "./mocks/expo-secure-store";

/** Bun otherwise executes the real PNG when screens load `require(...)`. */
mock.module("../assets/icon.png", () => ({ default: 1 }));

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

  setValue(value: number) {
    this._value = value;
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
  PlusIcon: () => React.createElement("Text", null, "+"),
  SettingsIcon: () => React.createElement("Text", null, "⚙"),
  CopyIcon: () => React.createElement("Text", null, "copy"),
  EllipsisVerticalIcon: () => React.createElement("Text", null, "more"),
  XIcon: () => React.createElement("Text", null, "close"),
  EyeIcon: () => React.createElement("Text", null, "eye"),
  EyeOffIcon: () => React.createElement("Text", null, "eye-off"),
  ChevronDownIcon: () => React.createElement("Text", null, "▼"),
  ListFilterIcon: () => React.createElement("Text", null, "sort"),
  ArrowDownAZIcon: () => React.createElement("Text", null, "a-z"),
  ClockIcon: () => React.createElement("Text", null, "clock"),
}));

mock.module("react-native-svg", () => {
  const Noop = () => null;
  const PassThrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  const Svg = ({
    children,
    width,
    height,
  }: {
    children?: React.ReactNode;
    width?: number;
    height?: number;
  }) => React.createElement("Svg", { width, height }, children);

  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle: Noop,
    Path: Noop,
    G: PassThrough,
    Defs: PassThrough,
    ClipPath: PassThrough,
  };
});

const setStringAsyncMock = mock(() => Promise.resolve());

mock.module("expo-clipboard", () => ({
  setStringAsync: setStringAsyncMock,
}));

Object.assign(globalThis, {
  __expoClipboardMocks: { setStringAsync: setStringAsyncMock },
});

const alertMock = mock(() => {});

Object.assign(globalThis, { __reactNativeAlertMocks: { alert: alertMock } });

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
  Alert: {
    alert: alertMock,
  },
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
  View: React.forwardRef(function View(
    props: Record<string, unknown>,
    ref: React.Ref<{
      measureInWindow: (callback: (...args: number[]) => void) => void;
    }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      measureInWindow: (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => {
        callback(0, 0, 200, 44);
      },
      measureLayout: (
        _relativeTo: unknown,
        onSuccess: (
          x: number,
          y: number,
          width: number,
          height: number,
        ) => void,
      ) => {
        onSuccess(0, 0, 200, 44);
      },
    }));
    return React.createElement(
      "View",
      props,
      props.children as React.ReactNode,
    );
  }),
  TextInput: createPrimitive("TextInput"),
  Image: createPrimitive("Image"),
  Animated,
  Easing,
  AppState: {
    addEventListener: (_event: string, handler: (state: string) => void) => ({
      remove: () => {},
    }),
  },
  BackHandler: {
    addEventListener: (_event: string, _handler: () => boolean) => ({
      remove: () => {},
    }),
  },
  useColorScheme: () => "light",
}));

mock.module("react-native-safe-area-context", () => ({
  SafeAreaView: createPrimitive("SafeAreaView"),
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
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
  Redirect: ({ href }: { href: string }) => {
    (expoRouterMocks.replace as (value: unknown) => void)(href);
    return null;
  },
}));
