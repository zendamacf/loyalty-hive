import * as Sentry from "@sentry/react-native";

import { getAppBuild, getAppRelease } from "@/lib/app-version";

export function getSentryInitOptions(): Parameters<typeof Sentry.init>[0] {
  return {
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
  };
}
