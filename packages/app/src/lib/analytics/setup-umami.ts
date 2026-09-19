import { initUmami } from "@bitte-kaufen/expo-umami";
import { logger } from "@sentry/react-native";

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
