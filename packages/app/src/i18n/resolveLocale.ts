import type { SupportedLocale } from "./i18n.constants";

export const localeFromDeviceCode = (
  deviceCode: string | null | undefined,
): SupportedLocale => {
  if (!deviceCode) {
    return "en";
  }
  const base = deviceCode.split("-")[0]?.toLowerCase();
  if (base === "es") {
    return "es";
  }
  if (base === "en") {
    return "en";
  }
  return "en";
};
