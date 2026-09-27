import * as Sentry from "@sentry/react-native";

import { getAppBuild, getAppRelease } from "@/lib/app-version";

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  Sentry.init({
    enabled: !__DEV__,
    environment: __DEV__
      ? "development"
      : (process.env.NODE_ENV ?? "production"),
    dsn: __DEV__ ? undefined : process.env.EXPO_PUBLIC_SENTRY_DSN,
    release: getAppRelease(),
    dist: getAppBuild(),
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.expoRouterIntegration(),
      Sentry.mobileReplayIntegration(),
    ],
  });
}

/** @internal Resets init guard for unit tests. */
export function resetSentryInitForTests(): void {
  initialized = false;
}
