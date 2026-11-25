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

/**
 * Admin auth needs its own secret. An empty secret, or the app user secret,
 * would let app tokens or forged tokens through, so both count as "not set".
 */
export function isAdminAuthConfigured(): boolean {
  const { secret } = config.adminJwt;
  return secret !== "" && secret !== config.jwt.accessSecret;
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
    if (typeof payload.sub !== "string") return null;
    return {
      adminId: payload.sub,
      issuedAt: typeof payload.iat === "number" ? payload.iat : 0,
    };
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
