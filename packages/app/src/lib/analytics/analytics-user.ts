import {
  clearUser,
  identifyUser,
  initUmami,
  isInitialized,
} from "@bitte-kaufen/expo-umami";
import { logger } from "@sentry/react-native";
import * as SecureStore from "expo-secure-store";

export const ANALYTICS_USER_ID_STORAGE_KEY = "loyalty-hive.analytics.user-id";

export async function setupUmami(): Promise<void> {
  const hostUrl = process.env.EXPO_PUBLIC_UMAMI_HOST;
  const websiteId = process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID;

  if (!hostUrl || !websiteId) {
    logger.error("Umami not configured", { hostUrl, websiteId });
    return;
  }

  logger.info("Initializing Umami", { hostUrl, websiteId });
  await initUmami({
    hostUrl,
    websiteId,
    disabled: __DEV__,
  });
}

export async function loadAnalyticsUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(ANALYTICS_USER_ID_STORAGE_KEY);
}

export async function persistAnalyticsUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(ANALYTICS_USER_ID_STORAGE_KEY, userId);
}

export async function clearAnalyticsUserId(): Promise<void> {
  await SecureStore.deleteItemAsync(ANALYTICS_USER_ID_STORAGE_KEY);
}

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
