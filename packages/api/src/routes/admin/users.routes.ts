import {
  and,
  count,
  desc,
  ilike,
  isNotNull,
  isNull,
  type SQL,
} from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import z from "zod";

import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";
import {
  type AdminEnv,
  requireAdmin,
} from "../../middleware/admin-auth.middleware.js";

export const ADMIN_USERS_DEFAULT_LIMIT = 50;
export const ADMIN_USERS_MAX_LIMIT = 100;

const listQuerySchema = z.object({
  search: z.string().trim().max(254).optional(),
  status: z.enum(["active", "pending_deletion"]).optional(),
  verified: z.enum(["true", "false"]).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_USERS_MAX_LIMIT)
    .default(ADMIN_USERS_DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Makes `%`, `_`, and `\` match as normal characters in a LIKE pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function buildWhere(query: z.infer<typeof listQuerySchema>): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.search) {
    conditions.push(ilike(users.email, `%${escapeLike(query.search)}%`));
  }
  if (query.status === "active") conditions.push(isNull(users.deletedAt));
  if (query.status === "pending_deletion") {
    conditions.push(isNotNull(users.deletedAt));
  }
  if (query.verified === "true") {
    conditions.push(isNotNull(users.emailVerifiedAt));
  }
  if (query.verified === "false")
    conditions.push(isNull(users.emailVerifiedAt));
  return and(...conditions);
}

const app = new Hono<AdminEnv>()
  .use(requireAdmin)
  .get("/", validator("query", listQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const where = buildWhere(query);

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          createdAt: users.createdAt,
          emailVerifiedAt: users.emailVerifiedAt,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt), desc(users.id))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ total: count() }).from(users).where(where),
    ]);

    return c.json({
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
        emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
        deletedAt: row.deletedAt?.toISOString() ?? null,
      })),
      total: totalRow?.total ?? 0,
      limit: query.limit,
      offset: query.offset,
    });
  });

export default app;
