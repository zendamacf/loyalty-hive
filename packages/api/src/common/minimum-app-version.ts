export const MINIMUM_APP_VERSIONS = {
  android: "0.0.1",
  ios: "0.0.1",
} as const;

export type SupportedAppPlatform = keyof typeof MINIMUM_APP_VERSIONS;

export const SUPPORTED_APP_PLATFORMS = Object.keys(
  MINIMUM_APP_VERSIONS,
) as SupportedAppPlatform[];

export function isSupportedAppPlatform(
  value: string,
): value is SupportedAppPlatform {
  return value in MINIMUM_APP_VERSIONS;
}

export function minimumAppVersionForPlatform(
  platform: SupportedAppPlatform,
): string {
  return MINIMUM_APP_VERSIONS[platform];
}
