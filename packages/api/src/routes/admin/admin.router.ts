import { Hono } from "hono";

import authRouter from "./auth.routes.js";

/**
 * Admin panel API at `/api/v1/admin`. Not in the OpenAPI docs.
 * Routes other than `/auth/*` must use `requireAdmin`.
 */
const app = new Hono().route("/auth", authRouter);

export default app;
