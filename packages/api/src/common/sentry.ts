import { Toucan } from "toucan-js";

import { API_PACKAGE_VERSION } from "../api-package.js";
import { config } from "./config.js";
import { dropExpectedErrors } from "./sentry-context.js";

export const SENTRY_RELEASE = `api@${API_PACKAGE_VERSION}`;

/** Options shared by the per-request scope and the background client. */
export function sentryOptions() {
  return {
    dsn: config.tracing.sentryDsn,
    environment: config.environment,
    release: SENTRY_RELEASE,
    beforeSend: dropExpectedErrors,
  };
}

let backgroundClient: Toucan | undefined;

/**
 * Reports an error from code that runs outside a request, such as a scheduled
 * job. Request errors go through the per-request scope instead.
 */
export function captureBackgroundError(error: unknown, source: string): void {
  if (!config.tracing.sentryDsn) return;
  backgroundClient ??= new Toucan(sentryOptions());
  backgroundClient.withScope((scope) => {
    scope.setTag("source", source);
    scope.captureException(error);
  });
}

/**
 * Reports promise rejections that nothing handled. The server keeps running,
 * as with Sentry's default "warn" mode, so one stray rejection does not take
 * down every request.
 */
export function installUnhandledRejectionHandler(): void {
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
    captureBackgroundError(reason, "unhandledRejection");
  });
}
