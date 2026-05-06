import { sentry } from "@hono/sentry";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "./common/config";
import apiRouter from "./router";

const app = new Hono<{ Variables: { userId?: string } }>();

app.use(logger());
app.use(
  "*",
  sentry({ dsn: config.tracing.sentryDsn, environment: config.environment }),
);

app.route("/api/v1", apiRouter);

app.onError((e, c) => {
  c.get("sentry").setUser({
    id: c.get("userId"),
  });
  c.get("sentry").captureException(e);
  return c.text("Internal Server Error", 500);
});

export default app;
