import * as Sentry from "@sentry/react-native";

import type { Client } from "./gen/client";
import { client } from "./gen/client.gen";

const installedClients = new WeakSet<Client>();

/**
 * Returns true for API failures that point to a bug: a 5xx response, or a
 * successful response the app could not read. 4xx responses are expected,
 * and requests with no response (offline, cancelled) are not bugs.
 */
export function shouldReportApiError(response: Response | undefined): boolean {
  if (!response) return false;
  return response.status >= 500 || response.ok;
}

/** Reports API failures to Sentry, tagged so they match the API's event. */
export function installErrorReportingInterceptor(
  targetClient: Client = client,
): void {
  if (installedClients.has(targetClient)) {
    return;
  }

  installedClients.add(targetClient);

  targetClient.interceptors.error.use((error, response, request, options) => {
    if (!shouldReportApiError(response) || !response) {
      return error;
    }

    const method = request?.method ?? options.method ?? "GET";
    // The URL template, such as /api/v1/cards/{id}, groups events without
    // ids or query strings, which can hold tokens.
    const route = options.url;
    const exception =
      error instanceof Error
        ? error
        : new Error(`${method} ${route} failed with ${response.status}`);

    Sentry.captureException(exception, {
      fingerprint: ["api-error", method, route, String(response.status)],
      tags: {
        "api.method": method,
        "api.route": route,
        "api.status": String(response.status),
        "request.id": request?.headers.get("x-request-id") ?? undefined,
      },
      extra: { body: error instanceof Error ? undefined : error },
    });

    return error;
  });
}
