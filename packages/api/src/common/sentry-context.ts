import type { Context } from "hono";
import {
  type ClientRequestMetadata,
  parseClientRequestMetadata,
} from "./client-headers.js";

export interface SentryScope {
  setTag(key: string, value: string): void;
  setContext(name: string, context: Record<string, unknown> | null): void;
  setUser(user: { id?: string } | null): void;
  captureException(error: unknown): void;
}

export function readClientRequestMetadata(c: Context): ClientRequestMetadata {
  return parseClientRequestMetadata({
    "x-client-id": c.req.header("x-client-id"),
    "x-app-version": c.req.header("x-app-version"),
    "x-app-build": c.req.header("x-app-build"),
    "x-app-platform": c.req.header("x-app-platform"),
    "x-request-id": c.req.header("x-request-id"),
    "x-os-version": c.req.header("x-os-version"),
    "user-agent": c.req.header("user-agent"),
  });
}

export function enrichSentryScope(
  sentry: SentryScope,
  c: Context,
  userId?: string | null,
): void {
  const client = readClientRequestMetadata(c);

  if (client.clientId) {
    sentry.setTag("client.id", client.clientId);
  }
  if (client.appVersion) {
    sentry.setTag("app.version", client.appVersion);
  }
  if (client.appPlatform) {
    sentry.setTag("app.platform", client.appPlatform);
  }
  if (client.requestId) {
    sentry.setTag("request.id", client.requestId);
  }
  if (client.osVersion) {
    sentry.setTag("app.os_version", client.osVersion);
  }

  sentry.setContext("client", {
    id: client.clientId,
    version: client.appVersion,
    build: client.appBuild,
    platform: client.appPlatform,
    osVersion: client.osVersion,
    userAgent: client.userAgent,
  });

  sentry.setContext("request", {
    id: client.requestId,
    method: c.req.method,
    path: c.req.path,
  });

  if (userId) {
    sentry.setUser({ id: userId });
  }
}
