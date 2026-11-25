import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono-openapi";
import z from "zod";

import { db } from "../../db/client.js";
import { brandRequests, users } from "../../db/schema.js";
import type { AdminEnv } from "../../middleware/admin-auth.middleware.js";

export const ADMIN_BRAND_REQUESTS_DEFAULT_LIMIT = 50;
export const ADMIN_BRAND_REQUESTS_MAX_LIMIT = 100;

const listQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_BRAND_REQUESTS_MAX_LIMIT)
    .default(ADMIN_BRAND_REQUESTS_DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

const app = new Hono<AdminEnv>().get(
  "/",
  validator("query", listQuerySchema),
  async (c) => {
    const { status, limit, offset } = c.req.valid("query");
    const where = status ? eq(brandRequests.status, status) : undefined;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: brandRequests.id,
          requestedName: brandRequests.requestedName,
          url: brandRequests.url,
          notes: brandRequests.notes,
          status: brandRequests.status,
          brandId: brandRequests.brandId,
          createdAt: brandRequests.createdAt,
          userId: users.id,
          userEmail: users.email,
        })
        .from(brandRequests)
        .innerJoin(users, eq(brandRequests.userId, users.id))
        .where(where)
        .orderBy(desc(brandRequests.createdAt), desc(brandRequests.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(brandRequests).where(where),
    ]);

    return c.json({
      items: rows.map((row) => ({
        id: row.id,
        requestedName: row.requestedName,
        url: row.url,
        notes: row.notes,
        status: row.status,
        brandId: row.brandId,
        createdAt: row.createdAt.toISOString(),
        user: { id: row.userId, email: row.userEmail },
      })),
      total: totalRow?.total ?? 0,
      limit,
      offset,
    });
  },
);

export default app;
