import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { secureHeaders } from "hono/secure-headers";

/** URL path of the admin panel. Must match `base` in packages/admin/vite.config.ts. */
export const ADMIN_PANEL_PATH = "/admin";

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";

/**
 * Serves the admin panel build (packages/admin/dist) at /admin.
 * Unknown paths get index.html, so client-side routes work on reload.
 * When the build is missing, all admin panel paths return 404.
 */
export function createAdminPanelApp(distDir: string) {
  const stripPrefix = (path: string) =>
    path.slice(ADMIN_PANEL_PATH.length) || "/";

  return new Hono()
    .use(
      `${ADMIN_PANEL_PATH}/*`,
      secureHeaders({
        xFrameOptions: "DENY",
        referrerPolicy: "no-referrer",
        contentSecurityPolicy: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      }),
    )
    .get(ADMIN_PANEL_PATH, (c) => c.redirect(`${ADMIN_PANEL_PATH}/`, 301))
    .get(
      `${ADMIN_PANEL_PATH}/assets/*`,
      serveStatic({
        root: distDir,
        rewriteRequestPath: stripPrefix,
        // Vite puts a content hash in asset file names.
        onFound: (_path, c) => {
          c.header("Cache-Control", IMMUTABLE_CACHE);
        },
      }),
      // A missing asset must not get index.html.
      (c) => c.notFound(),
    )
    .get(
      `${ADMIN_PANEL_PATH}/*`,
      serveStatic({
        root: distDir,
        rewriteRequestPath: stripPrefix,
        onFound: (_path, c) => {
          c.header("Cache-Control", NO_CACHE);
        },
      }),
      async (c) => {
        const index = Bun.file(join(distDir, "index.html"));
        if (!(await index.exists())) return c.notFound();
        c.header("Cache-Control", NO_CACHE);
        return c.html(await index.text());
      },
    );
}
