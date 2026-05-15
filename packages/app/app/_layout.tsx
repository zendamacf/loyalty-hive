import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import "@/i18n";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

Sentry.init({
  enabled: !__DEV__,
  environment: __DEV__ ? "development" : (process.env.NODE_ENV ?? "production"),
  dsn: __DEV__ ? undefined : process.env.SENTRY_DSN,
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
      <LanguageProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
});
