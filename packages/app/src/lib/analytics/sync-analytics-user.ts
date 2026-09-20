import { clearUser, identifyUser } from "@bitte-kaufen/expo-umami";

export async function syncAnalyticsUser(userId: string): Promise<void> {
  await identifyUser(userId);
}

export function clearAnalyticsUser(): void {
  clearUser();
}
