import { OverlayProvider } from "@/components/OverlayProvider";
import i18n from "@/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { QUERY_STALE_TIME_MS } from "@/lib/query-client";
import {
  UserPreferencesProvider,
  usePreferencesHydrated,
} from "@/lib/user-preferences";
import { AppSheets } from "@/sheets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react-native";
import { type ReactElement, type ReactNode, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { View } from "react-native";
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const TEST_PROVIDERS_READY_ID = "test-providers-ready";

/** Flushes deferred layout work (e.g. Select `setTimeout(updateMenuAnchor, 0)`). */
export async function flushAct(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

type PressOptions = {
  /** Flush deferred layout (Select menu anchor). Disable for async mutations. */
  flushLayout?: boolean;
};

/** Use for interactions that trigger overlay/layout or Pressable updates. */
export async function press(
  element: Parameters<typeof fireEvent.press>[0],
  options: PressOptions = {},
): Promise<void> {
  const { flushLayout = true } = options;
  // fireEvent is async in RNTL v14 — await it so updates flush before returning.
  await fireEvent.press(element);
  if (flushLayout) {
    await flushAct();
  }
}

export async function changeText(
  element: Parameters<typeof fireEvent.changeText>[0],
  text: string,
): Promise<void> {
  await fireEvent.changeText(element, text);
}

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
  // Stable client across re-renders. Creating a new QueryClient each render
  // remounts Auth/UserPreferences under RNTL v14's concurrent root.
  const [queryClient] = useState(createTestQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          <UserPreferencesProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SheetProvider>
                <AppSheets />
                <OverlayProvider>
                  <ProvidersSettled>{children}</ProvidersSettled>
                </OverlayProvider>
              </SheetProvider>
            </GestureHandlerRootView>
          </UserPreferencesProvider>
        </I18nextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Flushes async provider hydration after render. */
export async function settleProviders(
  result: Pick<RenderResult, "findByTestId">,
): Promise<void> {
  await result.findByTestId(TEST_PROVIDERS_READY_ID);
  await act(async () => {
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
}

export async function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): Promise<RenderResult> {
  const result = await render(ui, { wrapper: TestProviders, ...options });
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
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SheetProvider>
                  <AppSheets />
                  <OverlayProvider>
                    <ProvidersSettled>{children}</ProvidersSettled>
                  </OverlayProvider>
                </SheetProvider>
              </GestureHandlerRootView>
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
  const result = await render(ui, {
    wrapper: createQueryClientWrapper(queryClient),
  });
  await settleProviders(result);
  return {
    queryClient,
    ...result,
  };
}
