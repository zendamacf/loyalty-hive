import "react-native-gesture-handler";

import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { KeyboardAvoidingShell } from "@/components/KeyboardAvoidingShell";
import { OverlayProvider } from "@/components/OverlayProvider";
import { ThemedRoot } from "@/components/ThemedRoot";
import "@/i18n";

import { AuthProvider } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { UserPreferencesProvider } from "@/lib/user-preferences";
import { AppSheets } from "@/sheets";

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
          <UserPreferencesProvider>
            <ThemedRoot>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SheetProvider>
                  <AppSheets />
                  <OverlayProvider>
                    <KeyboardAvoidingShell>
                      <Stack screenOptions={{ headerShown: false }} />
                    </KeyboardAvoidingShell>
                  </OverlayProvider>
                </SheetProvider>
              </GestureHandlerRootView>
            </ThemedRoot>
          </UserPreferencesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
});
