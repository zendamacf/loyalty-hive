import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  type KeyboardEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";

type KeyboardAvoidingShellProps = {
  children: ReactNode;
};

export const KeyboardAvoidingShell = ({
  children,
}: KeyboardAvoidingShellProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener("keyboardDidShow", onShow);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (Platform.OS === "ios") {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        {children}
      </KeyboardAvoidingView>
    );
  }

  // Expo Go ignores app.json softwareKeyboardLayoutMode; JS inset works everywhere
  // on Android without the persistent gap from KeyboardAvoidingView + adjustResize.
  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
