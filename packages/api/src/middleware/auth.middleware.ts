import { eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { config } from "../common/config";
import {
  EMAIL_NOT_VERIFIED_MESSAGE,
  Forbidden,
  Unauthorized,
} from "../common/error";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

export type AuthEnv = {
  Variables: {
    userId: string | null;
  };
};

export const requireUserAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let userId: string | undefined;
  let issuedAt = 0;
  if (token) {
    try {
      const payload = await verify(token, config.jwt.accessSecret, "HS256");
      userId = payload.sub as string | undefined;
      issuedAt = typeof payload.iat === "number" ? payload.iat : 0;
    } catch {}
  }

  if (!userId)
    throw Unauthorized("You must be logged in to access this resource");

  // Reject tokens issued before the last password change (session revocation).
  const [user] = await db
    .select({ passwordChangedAt: users.passwordChangedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (
    user?.passwordChangedAt &&
    issuedAt < Math.floor(user.passwordChangedAt.getTime() / 1000)
  ) {
    throw Unauthorized("You must be logged in to access this resource");
  }

  c.set("userId", userId);
  return next();
};

export const requireEmailVerified: MiddlewareHandler<AuthEnv> = async (
  c,
  next,
) => {
  const userId = c.get("userId");
  if (!userId) {
    throw Unauthorized("You must be logged in to access this resource");
  }

  const [user] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.emailVerifiedAt) {
    throw Forbidden(EMAIL_NOT_VERIFIED_MESSAGE);
  }

  return next();
};
