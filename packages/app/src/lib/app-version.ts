import Constants from "expo-constants";
import { Platform } from "react-native";

export function getAppVersion(): string {
  return (
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown"
  );
}

export function getAppBuild(): string {
  const build =
    Constants.nativeBuildVersion ??
    (Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode?.toString()) ??
    "unknown";

  return String(build);
}

export function getAppRelease(): string {
  const slug = Constants.expoConfig?.slug ?? "loyaltyhive";
  return `${slug}@${getAppVersion()}`;
}
