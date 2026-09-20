import { isInitialized, trackCustomEvent } from "@bitte-kaufen/expo-umami";

import type { AnalyticsEventName } from "./analytics-events";

export type AnalyticsEventData = Record<
  string,
  string | number | boolean | null | undefined
>;

function normalizeEventData(
  data?: AnalyticsEventData,
): Record<string, string | number | boolean> | undefined {
  if (!data) {
    return undefined;
  }

  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export async function trackAppEvent(
  eventName: AnalyticsEventName,
  data?: AnalyticsEventData,
): Promise<void> {
  if (!isInitialized()) {
    return;
  }

  const normalizedData = normalizeEventData(data);

  await trackCustomEvent(
    `/events/${eventName}`,
    eventName,
    normalizedData ? { data: normalizedData } : undefined,
  );
}
