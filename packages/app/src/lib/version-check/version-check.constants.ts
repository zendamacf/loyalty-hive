export function shouldSkipVersionCheck(): boolean {
  return process.env.EXPO_PUBLIC_SKIP_VERSION_CHECK === "true";
}
