import { useEffect, useState } from "react";

import type { AnalyticsEventName } from "./analytics-events";
import {
  canRecordAnalytics,
  dispatchScreenView,
  subscribeAnalyticsReady,
} from "./analytics-state";
import { trackAppEvent } from "./track-app-event";

const DEFAULT_DEBOUNCE_MS = 500;

export function useCanRecordAnalytics(): boolean {
  const [canRecord, setCanRecord] = useState(canRecordAnalytics);

  useEffect(() => {
    setCanRecord(canRecordAnalytics());

    return subscribeAnalyticsReady(() => {
      setCanRecord(canRecordAnalytics());
    });
  }, []);

  return canRecord;
}

type TrackScreenViewOptions = {
  title?: string;
};

export function useTrackScreenView(
  path: string,
  options?: TrackScreenViewOptions,
): void {
  const canRecord = useCanRecordAnalytics();
  const title = options?.title;

  useEffect(() => {
    if (!canRecord) {
      return;
    }

    void dispatchScreenView(path, title);
  }, [canRecord, path, title]);
}

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
