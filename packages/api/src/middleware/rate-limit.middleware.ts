import type { MiddlewareHandler } from "hono";

import { getClientIp } from "../common/client-ip.js";
import { TooManyRequests } from "../common/error.js";
import {
  getAdminLoginEmailRateLimit,
  getAdminLoginIpRateLimit,
  getAuthDeleteAccountRateLimit,
  getAuthForgotPasswordEmailRateLimit,
  getAuthForgotPasswordIpRateLimit,
  getAuthLoginEmailRateLimit,
  getAuthLoginIpRateLimit,
  getAuthResendVerificationEmailRateLimit,
  getAuthResendVerificationIpRateLimit,
  getAuthResetPasswordIpRateLimit,
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

export const authResendVerificationIpRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const { max, windowMs } = getAuthResendVerificationIpRateLimit();
  enforceRateLimit(
    c,
    "auth:resend-verification:ip",
    getClientIp(c),
    max,
    windowMs,
  );
  return next();
};

export const authResendVerificationEmailRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const { email } = c.req.valid("json" as never) as { email: string };
  const { max, windowMs } = getAuthResendVerificationEmailRateLimit();
  enforceRateLimit(c, "auth:resend-verification:email", email, max, windowMs);
  return next();
};

export const authForgotPasswordIpRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const { max, windowMs } = getAuthForgotPasswordIpRateLimit();
  enforceRateLimit(c, "auth:forgot-password:ip", getClientIp(c), max, windowMs);
  return next();
};

export const authForgotPasswordEmailRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const { email } = c.req.valid("json" as never) as { email: string };
  const { max, windowMs } = getAuthForgotPasswordEmailRateLimit();
  enforceRateLimit(c, "auth:forgot-password:email", email, max, windowMs);
  return next();
};

export const authResetPasswordIpRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const { max, windowMs } = getAuthResetPasswordIpRateLimit();
  enforceRateLimit(c, "auth:reset-password:ip", getClientIp(c), max, windowMs);
  return next();
};

/** Limits wrong-password guesses. Run after `requireUserAuth`. */
export const authDeleteAccountRateLimit: MiddlewareHandler = async (
  c,
  next,
) => {
  const userId = c.get("userId") as string;
  const { max, windowMs } = getAuthDeleteAccountRateLimit();
  enforceRateLimit(c, "auth:delete-account:user", userId, max, windowMs);
  return next();
};

export const adminLoginIpRateLimit: MiddlewareHandler = async (c, next) => {
  const { max, windowMs } = getAdminLoginIpRateLimit();
  enforceRateLimit(c, "admin:login:ip", getClientIp(c), max, windowMs);
  return next();
};

export const adminLoginEmailRateLimit: MiddlewareHandler = async (c, next) => {
  const { email } = c.req.valid("json" as never) as { email: string };
  const { max, windowMs } = getAdminLoginEmailRateLimit();
  enforceRateLimit(c, "admin:login:email", email, max, windowMs);
  return next();
};
