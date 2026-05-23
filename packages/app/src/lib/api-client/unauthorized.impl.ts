// Implementation file for unauthorized interceptor
// Split due to race condition in CI tests

import type { Client } from "./gen/client";
import type { ResolvedRequestOptions } from "./gen/client/types.gen";

import { client } from "./gen/client.gen";
import type { Auth } from "./gen/core/auth.gen";

type UnauthorizedHandler = () => void | Promise<void>;

let onUnauthorized: UnauthorizedHandler | undefined;
let handlingUnauthorized = false;

const installedClients = new WeakSet<Client>();

export function requestUsesBearerAuth(
  options: Pick<ResolvedRequestOptions, "security">,
): boolean {
  return (
    options.security?.some(
      (auth: Auth) => auth.type === "http" && auth.scheme === "bearer",
    ) ?? false
  );
}

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | undefined,
): void {
  onUnauthorized = handler;
  if (handler === undefined) {
    handlingUnauthorized = false;
  }
}

async function handleUnauthorized(): Promise<void> {
  if (handlingUnauthorized || !onUnauthorized) {
    return;
  }

  handlingUnauthorized = true;
  try {
    await onUnauthorized();
  } finally {
    handlingUnauthorized = false;
  }
}

export function installUnauthorizedInterceptor(
  targetClient: Client = client,
): void {
  if (installedClients.has(targetClient)) {
    return;
  }

  installedClients.add(targetClient);

  targetClient.interceptors.response.use((response, _request, options) => {
    if (response.status === 401 && requestUsesBearerAuth(options)) {
      void handleUnauthorized();
    }

    return response;
  });
}
