export const CLIENT_ID_HEADER = "x-client-id";
export const APP_VERSION_HEADER = "x-app-version";
export const APP_BUILD_HEADER = "x-app-build";
export const APP_PLATFORM_HEADER = "x-app-platform";

export interface ClientRequestMetadata {
  clientId?: string;
  appVersion?: string;
  appBuild?: string;
  appPlatform?: string;
  userAgent?: string;
}

export function parseClientRequestMetadata(
  headers: Record<string, string | undefined>,
): ClientRequestMetadata {
  return {
    clientId: headers[CLIENT_ID_HEADER]?.trim() || undefined,
    appVersion: headers[APP_VERSION_HEADER]?.trim() || undefined,
    appBuild: headers[APP_BUILD_HEADER]?.trim() || undefined,
    appPlatform: headers[APP_PLATFORM_HEADER]?.trim() || undefined,
    userAgent: headers["user-agent"]?.trim() || undefined,
  };
}
