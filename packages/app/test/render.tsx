import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { AuthProvider } from "@/lib/auth";
import { QUERY_STALE_TIME_MS } from "@/lib/query-client";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { TestLanguageProvider } from "./TestLanguageProvider";

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

const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    <AuthProvider>
      <I18nextProvider i18n={i18n}>
        <TestLanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </TestLanguageProvider>
      </I18nextProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export function createQueryClientWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nextProvider i18n={i18n}>
            <TestLanguageProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </TestLanguageProvider>
          </I18nextProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

/** Renders with a single shared QueryClient (for cache / stale-time tests). */
export function renderWithSharedQueryClient(
  ui: ReactElement,
  queryClient = createTestQueryClient(),
): RenderResult & { queryClient: QueryClient } {
  return {
    queryClient,
    ...render(ui, { wrapper: createQueryClientWrapper(queryClient) }),
  };
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options });

/** @deprecated Use renderWithProviders */
export const renderWithTheme = renderWithProviders;
