import { eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";

import {
  getAdminSessionToken,
  verifyAdminToken,
} from "../common/admin-session.js";
import { Unauthorized } from "../common/error.js";
import { db } from "../db/client.js";
import { adminUsers } from "../db/schema.js";

export type AdminEnv = {
  Variables: {
    adminId: string;
  };
};

const ADMIN_UNAUTHORIZED_MESSAGE = "You must be logged in as an admin";

/** Accepts only the admin session cookie. App user tokens are never valid here. */
export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const token = getAdminSessionToken(c);
  const session = token ? await verifyAdminToken(token) : null;
  if (!session) throw Unauthorized(ADMIN_UNAUTHORIZED_MESSAGE);

  const [admin] = await db
    .select({
      disabledAt: adminUsers.disabledAt,
      passwordChangedAt: adminUsers.passwordChangedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.adminId));

  if (!admin || admin.disabledAt) {
    throw Unauthorized(ADMIN_UNAUTHORIZED_MESSAGE);
  }
  if (
    admin.passwordChangedAt &&
    session.issuedAt < Math.floor(admin.passwordChangedAt.getTime() / 1000)
  ) {
    throw Unauthorized(ADMIN_UNAUTHORIZED_MESSAGE);
  }

  c.set("adminId", session.adminId);
  return next();
};
