import {
  flush,
  isInitialized,
  trackCustomEvent,
  trackEvent,
  trackScreenView,
} from "@bitte-kaufen/expo-umami";

import { getAppVersion } from "@/lib/app-version";

export const ANALYTICS_APP_VERSION_KEY = "app_version";

function withAppVersionData<T extends Record<string, unknown>>(
  data: T = {} as T,
): T & { app_version: string } {
  return {
    ...data,
    [ANALYTICS_APP_VERSION_KEY]: getAppVersion(),
  };
}

function withAppVersionEventData(
  data?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return withAppVersionData(data ?? {});
}

export type AnalyticsIdentityMode = "pending" | "identified" | "deferred";

export type AnalyticsIdentityInput = {
  persistedUserId: string | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
};

export type AnalyticsIdentityResolution = {
  mode: AnalyticsIdentityMode;
  userId: string | null;
  shouldPersistUserId: boolean;
};

type BufferedScreenView = {
  type: "screen";
  path: string;
  title?: string;
};

type BufferedCustomEvent = {
  type: "custom";
  url: string;
  eventName: string;
  data?: Record<string, string | number | boolean>;
};

type BufferedTrackEvent = {
  type: "event";
  url: string;
  eventName: string;
  title: string;
  data: Record<string, unknown>;
};

type BufferedAnalyticsEvent =
  | BufferedScreenView
  | BufferedCustomEvent
  | BufferedTrackEvent;

let identityMode: AnalyticsIdentityMode = "pending";
const listeners = new Set<() => void>();
const buffer: BufferedAnalyticsEvent[] = [];

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getAnalyticsIdentityMode(): AnalyticsIdentityMode {
  return identityMode;
}

export function setAnalyticsIdentityMode(mode: AnalyticsIdentityMode): void {
  if (identityMode === mode) {
    return;
  }

  identityMode = mode;
  notifyListeners();
}

export function canRecordAnalytics(): boolean {
  return isInitialized() && identityMode !== "pending";
}

function isAnalyticsDeferred(): boolean {
  return identityMode === "deferred";
}

export function subscribeAnalyticsReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAnalyticsIdentityForTests(): void {
  identityMode = "pending";
  listeners.clear();
}

export function resolveAnalyticsIdentity(
  input: AnalyticsIdentityInput,
): AnalyticsIdentityResolution {
  const { persistedUserId, isAuthReady, isAuthenticated, userId } = input;

  if (persistedUserId) {
    return {
      mode: "identified",
      userId: persistedUserId,
      shouldPersistUserId: false,
    };
  }

  if (!isAuthReady) {
    return { mode: "pending", userId: null, shouldPersistUserId: false };
  }

  if (userId) {
    return {
      mode: "identified",
      userId,
      shouldPersistUserId: true,
    };
  }

  if (!isAuthenticated) {
    return { mode: "deferred", userId: null, shouldPersistUserId: false };
  }

  return { mode: "pending", userId: null, shouldPersistUserId: false };
}

function bufferAnalyticsEvent(event: BufferedAnalyticsEvent): void {
  buffer.push(event);
}

export function getBufferedAnalyticsEventCount(): number {
  return buffer.length;
}

export function clearBufferedAnalyticsEvents(): void {
  buffer.length = 0;
}

export async function flushBufferedAnalyticsEvents(): Promise<void> {
  if (buffer.length === 0 || !isInitialized()) {
    return;
  }

  const events = [...buffer];
  buffer.length = 0;

  for (const event of events) {
    switch (event.type) {
      case "screen":
        await trackScreenView(event.path, {
          ...(event.title ? { title: event.title } : {}),
          data: withAppVersionEventData(),
        });
        break;
      case "custom":
        await trackCustomEvent(event.url, event.eventName, {
          data: withAppVersionEventData(event.data),
        });
        break;
      case "event":
        await trackEvent(event.url, {
          eventName: event.eventName,
          title: event.title,
          data: withAppVersionData(event.data),
        });
        break;
    }
  }

  await flush();
}

export async function dispatchScreenView(
  path: string,
  title?: string,
): Promise<void> {
  if (!canRecordAnalytics()) {
    return;
  }

  if (isAnalyticsDeferred()) {
    bufferAnalyticsEvent({ type: "screen", path, title });
    return;
  }

  await trackScreenView(path, {
    ...(title ? { title } : {}),
    data: withAppVersionEventData(),
  });
}

export async function dispatchCustomEvent(
  url: string,
  eventName: string,
  data?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!canRecordAnalytics()) {
    return;
  }

  if (isAnalyticsDeferred()) {
    bufferAnalyticsEvent({ type: "custom", url, eventName, data });
    return;
  }

  await trackCustomEvent(url, eventName, {
    data: withAppVersionEventData(data),
  });
}

export async function dispatchTrackEvent(
  url: string,
  options: {
    eventName: string;
    title: string;
    data: Record<string, unknown>;
  },
): Promise<void> {
  if (!canRecordAnalytics()) {
    return;
  }

  if (isAnalyticsDeferred()) {
    bufferAnalyticsEvent({
      type: "event",
      url,
      eventName: options.eventName,
      title: options.title,
      data: options.data,
    });
    return;
  }

  await trackEvent(url, {
    ...options,
    data: withAppVersionData(options.data),
  });
}
