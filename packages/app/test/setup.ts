import { mock } from "bun:test";
import React from "react";

/// This is a bunch of mocks to allow testing of React Native components.
/// TODO: There must be a better solution for this.

const expoRouterMocks = {
  push: mock(() => {}),
  back: mock(() => {}),
  params: {} as Record<string, string | undefined>,
};

Object.assign(globalThis, { __expoRouterMocks: expoRouterMocks });

function createPrimitive(name: string) {
  const Primitive = (props: Record<string, unknown>) =>
    React.createElement(name, props, props.children as React.ReactNode);
  Primitive.displayName = name;
  return Primitive;
}

mock.module("react-native", () => ({
  FlatList: (props: {
    data: Array<Record<string, unknown>>;
    renderItem: (item: {
      item: Record<string, unknown>;
      index: number;
    }) => React.ReactNode;
  }) =>
    React.createElement(
      "FlatList",
      props,
      props.data.map((item, index) =>
        React.createElement(
          React.Fragment,
          { key: `${index}-${String(item.id ?? "row")}` },
          props.renderItem({ item, index }),
        ),
      ),
    ),
  Pressable: createPrimitive("Pressable"),
  ActivityIndicator: createPrimitive("ActivityIndicator"),
  StyleSheet: {
    create: (styles: object) => styles,
    flatten: (style: unknown) => style,
    absoluteFillObject: {},
  },
  Text: createPrimitive("Text"),
  TouchableOpacity: createPrimitive("TouchableOpacity"),
  View: createPrimitive("View"),
  TextInput: createPrimitive("TextInput"),
  Image: createPrimitive("Image"),
  useColorScheme: () => "light",
}));

mock.module("react-native-safe-area-context", () => ({
  SafeAreaView: createPrimitive("SafeAreaView"),
}));

mock.module("expo-router", () => ({
  router: {
    push: (arg: unknown) =>
      (expoRouterMocks.push as unknown as (value: unknown) => void)(arg),
    back: () => expoRouterMocks.back(),
  },
  useLocalSearchParams: () => expoRouterMocks.params,
}));
