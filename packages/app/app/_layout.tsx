import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { ThemeProvider } from "@/theme/ThemeProvider";

Sentry.init({
  environment: process.env.NODE_ENV ?? "development",
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

export default Sentry.wrap(function Layout() {
  // Workaround for https://github.com/AppAndFlow/react-native-safe-area-context/issues/667
  const isAndroid15 = Platform.OS === "android" && Platform.Version >= 35;
  return (
    <SafeAreaProvider
      style={
        isAndroid15 ? { marginBottom: initialWindowMetrics?.insets.bottom } : {}
      }
    >
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
});
