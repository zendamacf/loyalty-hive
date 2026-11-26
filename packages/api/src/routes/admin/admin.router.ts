import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { ADMIN_SESSION_COOKIE_PATH } from "../../common/constants.js";
import { PayloadTooLarge } from "../../common/error.js";
import {
  type AdminEnv,
  requireAdmin,
} from "../../middleware/admin-auth.middleware.js";
import authRouter from "./auth.routes.js";
import brandRequestsRouter from "./brand-requests.routes.js";
import sharesRouter from "./shares.routes.js";
import usersRouter from "./users.routes.js";

/** The only admin API paths that work without an admin session. */
export const ADMIN_PUBLIC_PATHS: ReadonlySet<string> = new Set([
  `${ADMIN_SESSION_COOKIE_PATH}/auth/login`,
  `${ADMIN_SESSION_COOKIE_PATH}/auth/logout`,
]);

/** Admin API bodies are small. A larger body is rejected before it is parsed. */
export const ADMIN_MAX_BODY_BYTES = 16 * 1024;

/**
 * Admin panel API at `/api/v1/admin`. Not in the OpenAPI docs.
 *
 * Every route needs an admin session, except ADMIN_PUBLIC_PATHS. The check is
 * here, so a new route cannot forget it. A path that is not an exact match
 * (other case, encoded, trailing slash) also needs a session.
 */
const app = new Hono<AdminEnv>()
  .use(async (c, next) => {
    await next();
    // Admin data must not stay in the browser cache.
    c.header("Cache-Control", "no-store");
  })
  .use(
    bodyLimit({
      maxSize: ADMIN_MAX_BODY_BYTES,
      onError: () => {
        throw PayloadTooLarge("Request body is too large");
      },
    }),
  )
  .use((c, next) =>
    ADMIN_PUBLIC_PATHS.has(c.req.path) ? next() : requireAdmin(c, next),
  )
  .route("/auth", authRouter)
  .route("/brand-requests", brandRequestsRouter)
  .route("/shares", sharesRouter)
  .route("/users", usersRouter);

export default app;
