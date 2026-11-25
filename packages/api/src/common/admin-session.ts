import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { CookieOptions } from "hono/utils/cookie";

import { config } from "./config.js";
import {
  ADMIN_JWT_AUDIENCE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_PATH,
} from "./constants.js";

/** A shorter HS256 secret can be guessed offline from one captured token. */
export const ADMIN_JWT_SECRET_MIN_LENGTH = 32;

/**
 * Returns why admin auth is off, or null when it is on. Admin auth needs its
 * own long secret. An empty, short, or shared secret would let forged tokens
 * or app tokens through.
 */
export function adminAuthConfigProblem(): string | null {
  const { secret } = config.adminJwt;
  if (secret === "") return "ADMIN_JWT_SECRET is not set";
  if (secret.length < ADMIN_JWT_SECRET_MIN_LENGTH) {
    return `ADMIN_JWT_SECRET must have at least ${ADMIN_JWT_SECRET_MIN_LENGTH} characters`;
  }
  if (secret === config.jwt.accessSecret) {
    return "ADMIN_JWT_SECRET must be different from JWT_ACCESS_SECRET";
  }
  return null;
}

export function isAdminAuthConfigured(): boolean {
  return adminAuthConfigProblem() === null;
}

export async function signAdminToken(adminId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: adminId,
      aud: ADMIN_JWT_AUDIENCE,
      iat: now,
      exp: now + config.adminJwt.ttlSeconds,
    },
    config.adminJwt.secret,
    "HS256",
  );
}

/** Returns the admin id and issue time, or null when the token is not valid. */
export async function verifyAdminToken(
  token: string,
): Promise<{ adminId: string; issuedAt: number } | null> {
  if (!isAdminAuthConfigured()) return null;
  try {
    const payload = await verify(token, config.adminJwt.secret, {
      alg: "HS256",
      aud: ADMIN_JWT_AUDIENCE,
    });
    // hono/jwt checks exp and iat only when they are present. Require them,
    // so that no token is valid forever.
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    return { adminId: payload.sub, issuedAt: payload.iat };
  } catch {
    return null;
  }
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Browsers accept Secure cookies on http://localhost, but some tools do not.
    secure: config.environment !== "development",
    sameSite: "Strict",
    path: ADMIN_SESSION_COOKIE_PATH,
  };
}

export function getAdminSessionToken(c: Context): string | undefined {
  return getCookie(c, ADMIN_SESSION_COOKIE);
}

export function setAdminSessionCookie(c: Context, token: string): void {
  setCookie(c, ADMIN_SESSION_COOKIE, token, {
    ...cookieOptions(),
    maxAge: config.adminJwt.ttlSeconds,
  });
}

export function clearAdminSessionCookie(c: Context): void {
  deleteCookie(c, ADMIN_SESSION_COOKIE, cookieOptions());
}
