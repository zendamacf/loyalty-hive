import { sentry } from "@hono/sentry";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { contextStorage } from "hono/context-storage";

import { openAPIRouteHandler } from "hono-openapi";
import { createAdminPanelApp } from "./admin-panel";
import apiRouter from "./api.router";
import { createAppLinksApp } from "./app-links";
import { config } from "./common/config";
import { codeGenDocs, publicDocs } from "./common/openapi-schema";
import { sentryOptions } from "./common/sentry";
import { enrichSentryScope } from "./common/sentry-context";
import { requestLogger } from "./middleware/request-logger.middleware";
import { sentryContext } from "./middleware/sentry-context.middleware";

const app = new Hono<{ Variables: { userId?: string } }>();

app
  .use(contextStorage())
  .use(requestLogger())
  .use("*", sentry(sentryOptions()))
  .use("*", sentryContext)
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
  .route("/", createAdminPanelApp(config.admin.distDir))
  .route("/", createAppLinksApp(config.appLinks.deepLinkBase))
  .get("/health", (c) => c.text("ok"));

if (config.exposeOpenApi) {
  app
    .get("/doc", openAPIRouteHandler(app, publicDocs))
    .get("/doc/gen", openAPIRouteHandler(app, codeGenDocs))
    .get("/", swaggerUI({ url: "/doc", title: "LoyaltyHive API" }));
} else {
  const openApiNotFound = (c: {
    body: (body: null, status: 404) => Response;
  }) => c.body(null, 404);
  app
    .get("/doc", openApiNotFound)
    .get("/doc/gen", openApiNotFound)
    .get("/", openApiNotFound);
}

// The sentry middleware reports the error after this handler returns.
app.onError((_e, c) => {
  enrichSentryScope(c.get("sentry"), c, c.get("userId"));
  return c.text("Internal Server Error", 500);
});

export default app;
