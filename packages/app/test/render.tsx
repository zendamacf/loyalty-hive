import { expect } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RenderOptions,
  type RenderResult,
  render,
  waitFor,
} from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { QUERY_STALE_TIME_MS } from "@/lib/query-client";
import { OverlayProvider } from "@/components/OverlayProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/theme/theme.constants";
import { TestLanguageProvider } from "./TestLanguageProvider";

export const TEST_PROVIDERS_READY_ID = "test-providers-ready";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: QUERY_STALE_TIME_MS,
      },
      mutations: { retry: false },
    },
  });
}

function ProvidersSettled({ children }: { children: ReactNode }) {
  const { isReady } = useAuth();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (!cancelled) {
        setThemeReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady || !themeReady) {
    return null;
  }

  return (
    <>
      <View testID={TEST_PROVIDERS_READY_ID} />
      {children}
    </>
  );
}

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          <TestLanguageProvider>
            <ThemeProvider>
              <OverlayProvider>
                <ProvidersSettled>{children}</ProvidersSettled>
              </OverlayProvider>
            </ThemeProvider>
          </TestLanguageProvider>
        </I18nextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Flushes async provider hydration after render. */
export async function settleProviders(
  result: Pick<RenderResult, "getByTestId">,
): Promise<void> {
  await waitFor(() => {
    expect(result.getByTestId(TEST_PROVIDERS_READY_ID)).toBeTruthy();
  });
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): Promise<RenderResult> {
  const result = render(ui, { wrapper: TestProviders, ...options });
  await settleProviders(result);
  return result;
}

export function createQueryClientWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nextProvider i18n={i18n}>
            <TestLanguageProvider>
              <ThemeProvider>
                <OverlayProvider>
                  <ProvidersSettled>{children}</ProvidersSettled>
                </OverlayProvider>
              </ThemeProvider>
            </TestLanguageProvider>
          </I18nextProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

/** Renders with a single shared QueryClient (for cache / stale-time tests). */
export async function renderWithSharedQueryClient(
  ui: ReactElement,
  queryClient = createTestQueryClient(),
): Promise<RenderResult & { queryClient: QueryClient }> {
  const result = render(ui, { wrapper: createQueryClientWrapper(queryClient) });
  await settleProviders(result);
  return {
    queryClient,
    ...result,
  };
}

/** @deprecated Use renderWithProviders */
export const renderWithTheme = renderWithProviders;
