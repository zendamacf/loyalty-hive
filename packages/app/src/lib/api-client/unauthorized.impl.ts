import type { Client } from "./gen/client";
import type { ResolvedRequestOptions } from "./gen/client/types.gen";
import { client } from "./gen/client.gen";
import type { Auth } from "./gen/core/auth.gen";

type UnauthorizedHandler = () => void | Promise<void>;

let onUnauthorized: UnauthorizedHandler | undefined;

const installedClients = new WeakSet<Client>();
const clientHandlers = new Map<Client, UnauthorizedHandler>();
const clientHandling = new Map<Client, boolean>();

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
    for (const targetClient of clientHandling.keys()) {
      clientHandling.set(targetClient, false);
    }
  }
}

/** Binds a handler to a specific client so tests are isolated from global auth state. */
export function bindUnauthorizedHandler(
  targetClient: Client,
  handler: UnauthorizedHandler | undefined,
): void {
  if (handler === undefined) {
    clientHandlers.delete(targetClient);
    clientHandling.delete(targetClient);
    return;
  }

  clientHandlers.set(targetClient, handler);
}

function resolveHandler(targetClient: Client): UnauthorizedHandler | undefined {
  return clientHandlers.get(targetClient) ?? onUnauthorized;
}

async function handleUnauthorized(targetClient: Client): Promise<void> {
  const handler = resolveHandler(targetClient);
  if (clientHandling.get(targetClient) || !handler) {
    return;
  }

  clientHandling.set(targetClient, true);
  try {
    await handler();
  } finally {
    clientHandling.set(targetClient, false);
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
      void handleUnauthorized(targetClient);
    }

    return response;
  });
}

export function resetUnauthorizedModuleStateForTests(): void {
  onUnauthorized = undefined;
  clientHandlers.clear();
  clientHandling.clear();
}
