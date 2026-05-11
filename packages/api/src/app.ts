import { sentry } from "@hono/sentry";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { openAPIRouteHandler } from "hono-openapi";
import apiRouter from "./api.router";
import { config } from "./common/config";

const app = new Hono<{ Variables: { userId?: string } }>();

app
  .use(logger())
  .use(
    "*",
    sentry({ dsn: config.tracing.sentryDsn, environment: config.environment }),
  )
  .route("/api/v1", apiRouter)
  .get(
    "/openapi",
    openAPIRouteHandler(app, {
      documentation: {
        info: { title: "Loyalty Hive API", version: "1.0.0" },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        servers: [
          { url: "http://localhost:3000", description: "Local server" },
          {
            url: "https://loyaltyhive.kalopsia.dev",
            description: "Production server",
          },
        ],
      },
    }),
  )
  .onError((e, c) => {
    c.get("sentry").setUser({
      id: c.get("userId"),
    });
    c.get("sentry").captureException(e);
    return c.text("Internal Server Error", 500);
  });

export default app;
