import { useEffect } from "react";

import type { AnalyticsEventName } from "./analytics-events";
import { trackAppEvent } from "./track-app-event";

const DEFAULT_DEBOUNCE_MS = 500;

export function useTrackDebouncedSearch(
  eventName: AnalyticsEventName,
  query: string,
  resultCount: number,
  debounceMs = DEFAULT_DEBOUNCE_MS,
): void {
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const timer = setTimeout(() => {
      void trackAppEvent(eventName, {
        query_length: trimmedQuery.length,
        result_count: resultCount,
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, eventName, query, resultCount]);
}
