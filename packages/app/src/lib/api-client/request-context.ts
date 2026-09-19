import type { Client } from "./gen/client";
import { client } from "./gen/client.gen";

const installedClients = new WeakSet<Client>();

export function createRequestId(): string {
  // https://stackoverflow.com/a/2117523/2069996
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.trunc(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
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
