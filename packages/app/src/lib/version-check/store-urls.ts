import { Platform } from "react-native";

const ANDROID_PACKAGE = "com.kalopsiaapps.loyaltyhive";

const STORE_URLS = {
  android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
  ios: null,
} as const;

export function getStoreUrl(): string | null {
  if (Platform.OS === "android") {
    return STORE_URLS.android;
  }

  if (Platform.OS === "ios") {
    return STORE_URLS.ios;
  }

  return null;
}
