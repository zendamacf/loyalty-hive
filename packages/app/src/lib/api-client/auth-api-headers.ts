export function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_API_KEY;
}

export function authApiHeaders(): { "x-api-key": string } {
  return { "x-api-key": getApiKey() ?? "" };
}
