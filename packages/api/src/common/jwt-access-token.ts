import { sign } from "hono/jwt";

import { config } from "./config.js";

export async function signAccessToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = config.jwt.accessTtlSeconds;

  return sign(
    {
      sub: userId,
      iat: now,
      exp: now + ttlSeconds,
    },
    config.jwt.accessSecret,
    "HS256",
  );
}
