import { config } from "./config.js";
import { APP_LINKS_PATH } from "./constants.js";

/** App screens that email links open. Each is a route in packages/app/app. */
export type AppLinkTarget = "verify-email" | "reset-password" | "accept-share";

/** Deep link that opens the app screen, e.g. `loyaltyhive://verify-email?token=…`. */
export function buildAppDeepLink(
  target: AppLinkTarget,
  token: string,
  deepLinkBase = config.appLinks.deepLinkBase,
): string {
  return `${deepLinkBase}${target}?token=${encodeURIComponent(token)}`;
}

/**
 * Link to put in an email. Gmail removes custom-scheme links, so this is an
 * https URL on the API that redirects to the deep link.
 * Without a base URL it falls back to the deep link.
 */
export function buildEmailLink(
  target: AppLinkTarget,
  token: string,
  baseUrl = config.server.baseUrl,
): string {
  if (!baseUrl) {
    return buildAppDeepLink(target, token);
  }
  return `${baseUrl}${APP_LINKS_PATH}/${target}?token=${encodeURIComponent(token)}`;
}
