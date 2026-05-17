import { getApiKey } from "./auth-api-headers";
import type { CreateClientConfig } from "./gen/client.gen";
import type { Auth } from "./gen/core/auth.gen";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

let bearerToken: string | undefined;

export function setBearerToken(token: string | undefined): void {
  bearerToken = token;
}

export function getBearerToken(): string | undefined {
  return bearerToken;
}

export const resolveClientAuth = (auth: Auth): string | undefined => {
  if (auth.type === "apiKey") {
    return getApiKey();
  }
  if (auth.scheme === "bearer") {
    return bearerToken;
  }
  return undefined;
};

export const createClientConfig: CreateClientConfig = (clientConfig) => ({
  ...clientConfig,
  baseUrl,
  auth: resolveClientAuth,
});
