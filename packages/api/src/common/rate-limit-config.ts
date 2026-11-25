import {
  AUTH_DELETE_ACCOUNT_RATE_LIMIT,
  AUTH_FORGOT_PASSWORD_EMAIL_RATE_LIMIT,
  AUTH_FORGOT_PASSWORD_IP_RATE_LIMIT,
  AUTH_RESEND_VERIFICATION_EMAIL_RATE_LIMIT,
  AUTH_RESEND_VERIFICATION_IP_RATE_LIMIT,
  AUTH_RESET_PASSWORD_IP_RATE_LIMIT,
} from "./constants.js";

function parsePositiveInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
  return parsed;
}

export function getAuthLoginIpRateLimit() {
  return {
    max: parsePositiveInt("RATE_LIMIT_AUTH_LOGIN_IP_MAX", 10),
    windowMs: parsePositiveInt("RATE_LIMIT_AUTH_LOGIN_IP_WINDOW_MS", 60_000),
  };
}

export function getAuthLoginEmailRateLimit() {
  return {
    max: parsePositiveInt("RATE_LIMIT_AUTH_LOGIN_EMAIL_MAX", 5),
    windowMs: parsePositiveInt("RATE_LIMIT_AUTH_LOGIN_EMAIL_WINDOW_MS", 60_000),
  };
}

export function getAuthSignupIpRateLimit() {
  return {
    max: parsePositiveInt("RATE_LIMIT_AUTH_SIGNUP_IP_MAX", 5),
    windowMs: parsePositiveInt("RATE_LIMIT_AUTH_SIGNUP_IP_WINDOW_MS", 60_000),
  };
}

export function getAuthResendVerificationIpRateLimit() {
  return AUTH_RESEND_VERIFICATION_IP_RATE_LIMIT;
}

export function getAuthResendVerificationEmailRateLimit() {
  return AUTH_RESEND_VERIFICATION_EMAIL_RATE_LIMIT;
}

export function getAuthForgotPasswordIpRateLimit() {
  return AUTH_FORGOT_PASSWORD_IP_RATE_LIMIT;
}

export function getAuthForgotPasswordEmailRateLimit() {
  return AUTH_FORGOT_PASSWORD_EMAIL_RATE_LIMIT;
}

export function getAuthResetPasswordIpRateLimit() {
  return AUTH_RESET_PASSWORD_IP_RATE_LIMIT;
}

export function getAuthDeleteAccountRateLimit() {
  return {
    max: parsePositiveInt(
      "RATE_LIMIT_AUTH_DELETE_ACCOUNT_MAX",
      AUTH_DELETE_ACCOUNT_RATE_LIMIT.max,
    ),
    windowMs: parsePositiveInt(
      "RATE_LIMIT_AUTH_DELETE_ACCOUNT_WINDOW_MS",
      AUTH_DELETE_ACCOUNT_RATE_LIMIT.windowMs,
    ),
  };
}
