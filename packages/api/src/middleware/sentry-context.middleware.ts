import type { MiddlewareHandler } from "hono";
import { enrichSentryScope } from "../common/sentry-context.js";

export const sentryContext: MiddlewareHandler = async (c, next) => {
  enrichSentryScope(c.get("sentry"), c, c.get("userId"));
  return next();
};
