import type { MiddlewareHandler } from "hono";

import { getClientIp } from "../common/client-ip.js";
import { TooManyRequests } from "../common/error.js";
import {
  getAuthLoginEmailRateLimit,
  getAuthLoginIpRateLimit,
  getAuthSignupIpRateLimit,
} from "../common/rate-limit-config.js";
import { rateLimitStore } from "../common/rate-limit-store.js";

function enforceRateLimit(
  c: Parameters<MiddlewareHandler>[0],
  scope: string,
  keySuffix: string,
  max: number,
  windowMs: number,
): void {
  const result = rateLimitStore.consume(`${scope}:${keySuffix}`, max, windowMs);
  if (!result.allowed) {
    c.header("Retry-After", String(result.retryAfterSec));
    throw TooManyRequests("Too many requests");
  }
}

export const authLoginIpRateLimit: MiddlewareHandler = async (c, next) => {
  const { max, windowMs } = getAuthLoginIpRateLimit();
  enforceRateLimit(c, "auth:login:ip", getClientIp(c), max, windowMs);
  return next();
};

export const authSignupIpRateLimit: MiddlewareHandler = async (c, next) => {
  const { max, windowMs } = getAuthSignupIpRateLimit();
  enforceRateLimit(c, "auth:signup:ip", getClientIp(c), max, windowMs);
  return next();
};

export const authLoginEmailRateLimit: MiddlewareHandler = async (c, next) => {
  const { email } = c.req.valid("json" as never) as { email: string };
  const { max, windowMs } = getAuthLoginEmailRateLimit();
  enforceRateLimit(c, "auth:login:email", email, max, windowMs);
  return next();
};
