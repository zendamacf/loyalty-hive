import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";

focusManager.setEventListener((onFocus) => {
  const subscription = AppState.addEventListener("change", (state) => {
    onFocus(state === "active");
  });
  return () => subscription.remove();
});

export const QUERY_STALE_TIME_MS = 5 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: QUERY_STALE_TIME_MS,
    },
  },
});
