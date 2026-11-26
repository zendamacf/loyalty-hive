import * as Sentry from "@sentry/react-native";

import type { Client } from "./gen/client";
import { client } from "./gen/client.gen";
import { REQUEST_ID_HEADER } from "./request-context";

const installedClients = new WeakSet<Client>();

/**
 * Reports API failures that point to a bug to Sentry: a 5xx response, or a
 * successful response the app could not read. 4xx responses are expected,
 * and requests with no response (offline, cancelled) are not bugs. Events are
 * tagged with the request id, so they match the API's event.
 */
export function installErrorReportingInterceptor(
  targetClient: Client = client,
): void {
  if (installedClients.has(targetClient)) {
    return;
  }

  installedClients.add(targetClient);

  targetClient.interceptors.error.use((error, response, request, options) => {
    if (!response || (response.status < 500 && !response.ok)) {
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
        "request.id": request?.headers.get(REQUEST_ID_HEADER) ?? undefined,
      },
      extra: { body: error instanceof Error ? undefined : error },
    });

    return error;
  });
}
