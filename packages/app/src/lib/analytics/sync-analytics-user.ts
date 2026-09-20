import {
  clearUser,
  identifyUser,
  isInitialized,
} from "@bitte-kaufen/expo-umami";

export async function syncAnalyticsUser(userId: string): Promise<void> {
  if (!isInitialized()) {
    return;
  }

  await identifyUser(userId);
}

export function clearAnalyticsUser(): void {
  if (!isInitialized()) {
    return;
  }

  clearUser();
}
