import { Hono } from "hono";

import { type AppLinkTarget, buildAppDeepLink } from "./common/app-links";
import { APP_LINKS_PATH } from "./common/constants";

/**
 * Email links open `/links/<target>?token=…`, which redirects to the app.
 * Gmail and other clients remove custom-scheme links from emails.
 */
export function createAppLinksApp(deepLinkBase: string) {
  return new Hono().get(
    `${APP_LINKS_PATH}/:target{verify-email|reset-password|accept-share}`,
    (c) => {
      const target = c.req.param("target") as AppLinkTarget;
      const token = c.req.query("token");
      if (!token) return c.text("This link is incomplete.", 400);

      // The URL holds a token: do not cache it or send it to other sites.
      c.header("Cache-Control", "no-store");
      c.header("Referrer-Policy", "no-referrer");
      return c.redirect(buildAppDeepLink(target, token, deepLinkBase), 302);
    },
  );
}
