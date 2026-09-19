import Constants from "expo-constants";
import { Platform } from "react-native";

export const CLIENT_ID = "loyaltyhive-app";

export function osVersionHeader(): string {
  if (Platform.OS === "ios") {
    const { systemName, osVersion } = Platform.constants as {
      systemName?: string;
      osVersion?: string;
    };

    return `${systemName ?? "iOS"} ${osVersion ?? Platform.Version}`;
  }

  if (Platform.OS === "android") {
    const { Release } = Platform.constants as { Release?: string };

    return `Android ${Release ?? Platform.Version}`;
  }

  return String(Platform.Version);
}

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
    "x-os-version": osVersionHeader(),
  };
}
