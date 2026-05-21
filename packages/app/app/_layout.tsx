import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { KeyboardAvoidingShell } from "@/components/KeyboardAvoidingShell";
import { OverlayProvider } from "@/components/OverlayProvider";
import { ThemedRoot } from "@/components/ThemedRoot";
import "@/i18n";

import * as Sentry from "@sentry/react-native";

import { LanguageProvider } from "@/i18n/LanguageProvider";
import { AuthProvider } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
            <ThemedRoot>
              <OverlayProvider>
                <KeyboardAvoidingShell>
                  <Stack screenOptions={{ headerShown: false }} />
                </KeyboardAvoidingShell>
              </OverlayProvider>
            </ThemedRoot>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
});
