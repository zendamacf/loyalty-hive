import {
  AUTH_RESEND_VERIFICATION_EMAIL_RATE_LIMIT,
  AUTH_RESEND_VERIFICATION_IP_RATE_LIMIT,
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
