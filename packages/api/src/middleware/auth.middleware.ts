import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { config } from "../common/config";
import { Unauthorized } from "../common/error";

export type AuthEnv = {
  Variables: {
    userId: string | null;
  };
};

export const requireUserAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let userId: string | undefined;
  if (token) {
    try {
      const payload = await verify(token, config.jwt.accessSecret, "HS256");
      userId = payload.sub as string | undefined;
    } catch {}
  }

  if (!userId)
    throw Unauthorized("You must be logged in to access this resource");

  c.set("userId", userId);
  return next();
};
