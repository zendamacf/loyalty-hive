import { Platform } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { HomeScreen } from "../src/screens/HomeScreen";

export default function App() {
  // Workaround for https://github.com/AppAndFlow/react-native-safe-area-context/issues/667
  const isAndroid15 = Platform.OS === "android" && Platform.Version >= 35;
  return (
    <SafeAreaProvider
      style={
        isAndroid15 ? { marginBottom: initialWindowMetrics?.insets.bottom } : {}
      }
    >
      <HomeScreen />
    </SafeAreaProvider>
  );
}
