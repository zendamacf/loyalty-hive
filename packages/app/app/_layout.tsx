import "react-native-gesture-handler";

import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary as ExpoErrorBoundary, Stack } from "expo-router";
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

import { AnalyticsProvider } from "@/lib/analytics";
import { AuthProvider } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import {
  SentryProvider,
  wrapExpoErrorBoundary,
  wrapRootLayout,
} from "@/lib/sentry";
import { UserPreferencesProvider } from "@/lib/user-preferences";
import { AppSheets } from "@/sheets";

export const ErrorBoundary = wrapExpoErrorBoundary(ExpoErrorBoundary);

function RootLayout() {
  return (
    <SentryProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <AuthProvider>
            <AnalyticsProvider>
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
            </AnalyticsProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </SentryProvider>
  );
}

export default wrapRootLayout(RootLayout);
