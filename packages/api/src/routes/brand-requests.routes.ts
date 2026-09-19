import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import { errorResponse, jsonResponse } from "../common/openapi-responses.js";
import { db } from "../db/client.js";
import { brandRequests, brands } from "../db/schema.js";
import { requireUserAuth } from "../middleware/auth.middleware.js";

export const brandRequestSchema = z.object({
  id: z.uuid(),
  requestedName: z.string(),
  url: z.string(),
  notes: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  createdAt: z.string(),
});

const brandRequestCreateSchema = z.object({
  requestedName: z.string().trim().min(2).max(100),
  url: z.url(),
  notes: z.string().trim().max(500).nullable().optional(),
});

interface ContextVariables {
  userId: string;
}

function normalizeBrandName(name: string): string {
  return name.trim().toLowerCase();
}

function toBrandRequestResponse(
  row: typeof brandRequests.$inferSelect,
): z.infer<typeof brandRequestSchema> {
  return {
    id: row.id,
    requestedName: row.requestedName,
    url: row.url,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

const app = new Hono<{ Variables: ContextVariables }>()
  .use(requireUserAuth)
  .post(
    "/",
    describeRoute({
      description: "Request a new loyalty brand be added to the catalog",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse(
          "Existing pending request for this brand name",
          brandRequestSchema,
        ),
        201: jsonResponse("Brand request created", brandRequestSchema),
        400: errorResponse("Invalid input or brand already exists"),
        401: errorResponse("Unauthorized"),
      },
    }),
    validator("json", brandRequestCreateSchema),
    async (c) => {
      const body = c.req.valid("json");
      const userId = c.get("userId");
      const requestedName = body.requestedName.trim();
      const normalizedName = normalizeBrandName(requestedName);

      const [existingBrand] = await db
        .select({ id: brands.id })
        .from(brands)
        .where(sql`lower(${brands.name}) = ${normalizedName}`)
        .limit(1);

      if (existingBrand) {
        return c.json({ error: "Brand already exists in the catalog" }, 400);
      }

      const [existingRequest] = await db
        .select()
        .from(brandRequests)
        .where(
          and(
            eq(brandRequests.userId, userId),
            eq(brandRequests.normalizedName, normalizedName),
            eq(brandRequests.status, "pending"),
          ),
        )
        .limit(1);

      if (existingRequest) {
        return c.json(toBrandRequestResponse(existingRequest), 200);
      }

      const [created] = await db
        .insert(brandRequests)
        .values({
          userId,
          requestedName,
          normalizedName,
          url: body.url,
          notes: body.notes ?? null,
        })
        .returning();

      return c.json(toBrandRequestResponse(created), 201);
    },
  );

export default app;
