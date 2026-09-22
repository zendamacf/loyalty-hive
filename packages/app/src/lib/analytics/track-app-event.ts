import type { AnalyticsEventName } from "./analytics-events";
import { dispatchCustomEvent } from "./analytics-state";

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
  const normalizedData = normalizeEventData(data);

  await dispatchCustomEvent(`/events/${eventName}`, eventName, normalizedData);
}
