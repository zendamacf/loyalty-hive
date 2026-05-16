import type { CreateClientConfig } from "./gen/client.gen";

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

export const createClientConfig: CreateClientConfig = (clientConfig) => ({
  ...clientConfig,
  baseUrl,
});
