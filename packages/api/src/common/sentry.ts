import type { MiddlewareHandler } from "hono";
import { Toucan } from "toucan-js";

import { API_PACKAGE_VERSION } from "../api-package.js";
import { config } from "./config.js";
import { enrichSentryScope } from "./sentry-context.js";

declare module "hono" {
  interface ContextVariableMap {
    sentry: Toucan;
  }
}

const sentryOptions = {
  dsn: config.tracing.sentryDsn,
  environment: config.environment,
  release: `api@${API_PACKAGE_VERSION}`,
};

/**
 * Gives each request its own Sentry scope, and reports the request's error
 * only when the response is a 5xx. Handled 4xx errors, such as a missing
 * session or invalid input, are expected and not reported.
 */
export const sentryMiddleware: MiddlewareHandler<{
  Variables: { userId?: string | null };
}> = async (c, next) => {
  const scope = new Toucan({
    ...sentryOptions,
    request: c.req.raw,
    requestDataOptions: {
      allowedHeaders: ["user-agent"],
      allowedSearchParams: /(.*)/,
    },
  });
  c.set("sentry", scope);
  await next();
  if (c.error && c.res.status >= 500) {
    enrichSentryScope(scope, c, c.get("userId"));
    scope.captureException(c.error);
  }
};

let backgroundClient: Toucan | undefined;

/**
 * Reports an error from code that runs outside a request, such as a scheduled
 * job. Request errors go through the per-request scope instead.
 */
export function captureBackgroundError(error: unknown, source: string): void {
  if (!config.tracing.sentryDsn) return;
  backgroundClient ??= new Toucan(sentryOptions);
  backgroundClient.captureException(error, {
    captureContext: { tags: { source } },
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
