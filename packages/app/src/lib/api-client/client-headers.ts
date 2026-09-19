import Constants from "expo-constants";
import { Platform } from "react-native";

export const CLIENT_ID = "loyaltyhive-app";

export function clientHeaders(): Record<string, string> {
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown";
  const build =
    Constants.nativeBuildVersion ??
    (Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode?.toString()) ??
    "unknown";

  return {
    "x-client-id": CLIENT_ID,
    "x-app-version": version,
    "x-app-build": String(build),
    "x-app-platform": Platform.OS,
  };
}
