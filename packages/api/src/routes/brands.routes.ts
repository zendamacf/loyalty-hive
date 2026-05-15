import { asc } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import z from "zod";
import { logoUrl } from "../common/storage.js";
import { db } from "../db/client.js";
import { brands } from "../db/schema.js";
import { requireUserAuth } from "../middleware/auth.middleware.js";

export const brandSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  logoUrl: z.string(),
  backgroundColor: z.string(),
  createdAt: z.string(),
});

interface ContextVariables {
  userId: string;
}

const app = new Hono<{ Variables: ContextVariables }>()
  .use(requireUserAuth)
  .get(
    "/",
    describeRoute({
      description: "List loyalty brands available in the catalog",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": { schema: resolver(z.array(brandSchema)) },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const rows = await db
        .select({
          id: brands.id,
          name: brands.name,
          logoFile: brands.logoFile,
          backgroundColor: brands.backgroundColor,
          createdAt: brands.createdAt,
        })
        .from(brands)
        .orderBy(asc(brands.name));

      return c.json(
        rows.map<z.infer<typeof brandSchema>>((row) => ({
          ...row,
          id: row.id,
          logoUrl: logoUrl(row.logoFile),
          backgroundColor: row.backgroundColor,
          createdAt: row.createdAt.toISOString(),
        })),
      );
    },
  );

export default app;
