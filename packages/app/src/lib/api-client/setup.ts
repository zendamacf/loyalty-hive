import type { CreateClientConfig } from "./gen/client.gen";

export const createClientConfig: CreateClientConfig = (clientConfig) => ({
  ...clientConfig,
  baseUrl: process.env.API_URL,
});
