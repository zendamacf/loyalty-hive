import { Platform } from "react-native";

import { getAppBuild, getAppVersion } from "@/lib/app-version";

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
  return {
    "x-client-id": CLIENT_ID,
    "x-app-version": getAppVersion(),
    "x-app-build": getAppBuild(),
    "x-app-platform": Platform.OS,
    "x-os-version": osVersionHeader(),
  };
}
