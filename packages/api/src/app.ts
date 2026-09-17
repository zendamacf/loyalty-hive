import { sentry } from "@hono/sentry";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { logger } from "hono/logger";

import { openAPIRouteHandler } from "hono-openapi";
import apiRouter from "./api.router";
import { config } from "./common/config";
import { codeGenDocs, publicDocs } from "./common/openapi-schema";

const app = new Hono<{ Variables: { userId?: string } }>();

app
  .use(logger())
  .use(
    "*",
    sentry({ dsn: config.tracing.sentryDsn, environment: config.environment }),
  )
  .use(
    "/logos/*",
    serveStatic({
      root: "./public",
      onFound: (_path, c) => {
        c.header("Cache-Control", "public, max-age=86400");
      },
    }),
  )
  .route("/api/v1", apiRouter)
  .get("/health", (c) => c.text("ok"))
  .get("/doc", openAPIRouteHandler(app, publicDocs))
  .get("/doc/gen", openAPIRouteHandler(app, codeGenDocs))
  .get("/", swaggerUI({ url: "/doc", title: "LoyaltyHive API" }))
  .onError((e, c) => {
    c.get("sentry").setUser({
      id: c.get("userId"),
    });
    c.get("sentry").captureException(e);
    return c.text("Internal Server Error", 500);
  });

export default app;
