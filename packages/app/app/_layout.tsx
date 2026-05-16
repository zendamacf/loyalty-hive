import { Stack } from "expo-router";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { KeyboardAvoidingShell } from "@/components/KeyboardAvoidingShell";
import { ThemedRoot } from "@/components/ThemedRoot";
import "@/i18n";

import * as Sentry from "@sentry/react-native";

import { LanguageProvider } from "@/i18n/LanguageProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

Sentry.init({
  enabled: !__DEV__,
  environment: __DEV__ ? "development" : (process.env.NODE_ENV ?? "production"),
  dsn: __DEV__ ? undefined : process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

export default Sentry.wrap(function Layout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LanguageProvider>
        <ThemeProvider>
          <ThemedRoot>
            <KeyboardAvoidingShell>
              <Stack screenOptions={{ headerShown: false }} />
            </KeyboardAvoidingShell>
          </ThemedRoot>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
});
