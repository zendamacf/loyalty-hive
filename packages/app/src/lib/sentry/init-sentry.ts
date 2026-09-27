import * as Sentry from "@sentry/react-native";

import { getSentryInitOptions } from "./sentry-init-options";

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  initialized = true;
  Sentry.init(getSentryInitOptions());
}
