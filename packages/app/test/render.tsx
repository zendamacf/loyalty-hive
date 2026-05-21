import { expect } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RenderOptions,
  type RenderResult,
  render,
  waitFor,
} from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { QUERY_STALE_TIME_MS } from "@/lib/query-client";
import {
  UserPreferencesProvider,
  usePreferencesHydrated,
} from "@/lib/user-preferences";
import { OverlayProvider } from "@/components/OverlayProvider";

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
  const preferencesReady = usePreferencesHydrated();

  if (!isReady || !preferencesReady) {
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
          <UserPreferencesProvider>
            <OverlayProvider>
              <ProvidersSettled>{children}</ProvidersSettled>
            </OverlayProvider>
          </UserPreferencesProvider>
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
            <UserPreferencesProvider>
              <OverlayProvider>
                <ProvidersSettled>{children}</ProvidersSettled>
              </OverlayProvider>
            </UserPreferencesProvider>
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
