import { count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import z from "zod";

import { db } from "../../db/client.js";
import { cardShares, shareScopes, users } from "../../db/schema.js";
import type { AdminEnv } from "../../middleware/admin-auth.middleware.js";

export const ADMIN_SHARES_DEFAULT_LIMIT = 50;
export const ADMIN_SHARES_MAX_LIMIT = 100;

const listQuerySchema = z.object({
  scope: z.enum(shareScopes).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_SHARES_MAX_LIMIT)
    .default(ADMIN_SHARES_DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

const owners = alias(users, "owners");
const recipients = alias(users, "recipients");

/**
 * Accepted shares, newest first. Shows the scope only, not which cards.
 * Pending invites are not listed: they can hold emails of people with no account.
 */
const app = new Hono<AdminEnv>().get(
  "/",
  validator("query", listQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const where = query.scope ? eq(cardShares.scope, query.scope) : undefined;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: cardShares.id,
          scope: cardShares.scope,
          ownerEmail: owners.email,
          recipientEmail: recipients.email,
          createdAt: cardShares.createdAt,
        })
        .from(cardShares)
        .innerJoin(owners, eq(owners.id, cardShares.ownerId))
        .innerJoin(recipients, eq(recipients.id, cardShares.recipientId))
        .where(where)
        .orderBy(desc(cardShares.createdAt), desc(cardShares.id))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ total: count() }).from(cardShares).where(where),
    ]);

    return c.json({
      items: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      total: totalRow?.total ?? 0,
      limit: query.limit,
      offset: query.offset,
    });
  },
);

export default app;
