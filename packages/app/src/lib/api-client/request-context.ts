import type { Client } from "./gen/client";
import { client } from "./gen/client.gen";

const installedClients = new WeakSet<Client>();

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function installRequestContextInterceptor(
  targetClient: Client = client,
): void {
  if (installedClients.has(targetClient)) {
    return;
  }

  installedClients.add(targetClient);

  targetClient.interceptors.request.use((request) => {
    const headers = new Headers(request.headers);
    headers.set("x-request-id", createRequestId());
    return new Request(request, { headers });
  });
}
