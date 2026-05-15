import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import z from "zod";
import { logoUrl } from "../common/storage.js";
import { db } from "../db/client.js";
import { brands, cards } from "../db/schema.js";
import { requireUserAuth } from "../middleware/auth.middleware.js";

export const cardSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  cardNumber: z.string(),
  label: z.string().nullable().optional(),
  brand: z
    .object({
      id: z.uuid(),
      name: z.string(),
      logoUrl: z.string(),
      backgroundColor: z.string(),
    })
    .nullable(),
  createdAt: z.string(),
});

const idParamSchema = z.object({
  id: z.uuid(),
});

const cardWriteSchema = z.object({
  cardNumber: z.string(),
  label: z.string().nullable().optional(),
  brandId: z.uuid().nullable().optional(),
});

interface ContextVariables {
  userId: string;
}

const app = new Hono<{ Variables: ContextVariables }>()
  .use(requireUserAuth)
  .get(
    "/",
    describeRoute({
      description: "Get all cards for the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": { schema: resolver(z.array(cardSchema)) },
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
      const result = await db
        .select({
          id: cards.id,
          userId: cards.userId,
          cardNumber: cards.cardNumber,
          label: cards.label,
          brandId: cards.brandId,
          brandName: brands.name,
          brandLogoFile: brands.logoFile,
          brandBackgroundColor: brands.backgroundColor,
          createdAt: cards.createdAt,
        })
        .from(cards)
        .leftJoin(brands, eq(cards.brandId, brands.id))
        .where(eq(cards.userId, c.get("userId")));

      return c.json(
        result.map<z.infer<typeof cardSchema>>((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          brand: r.brandId
            ? {
                id: r.brandId,
                name: r.brandName ?? "",
                logoUrl: logoUrl(r.brandLogoFile ?? ""),
                backgroundColor: r.brandBackgroundColor ?? "#000000",
              }
            : null,
        })),
      );
    },
  )
  .post(
    "/",
    describeRoute({
      description: "Create a new card for the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Successful response",
          content: { "application/json": { schema: resolver(cardSchema) } },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        409: {
          description: "Card for user already exists",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        400: {
          description: "Referenced userId or brandId does not exist",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator("json", cardWriteSchema),
    async (c) => {
      const body = c.req.valid("json");

      try {
        const [created] = await db
          .insert(cards)
          .values({
            userId: c.get("userId"),
            cardNumber: body.cardNumber,
            label: body.label ?? null,
            brandId: body.brandId ?? null,
          })
          .returning();
        if (created.brandId) {
          const [brand] = await db
            .select()
            .from(brands)
            .where(eq(brands.id, created.brandId));
          return c.json(
            {
              ...created,
              brand: brand.id
                ? {
                    id: brand.id,
                    name: brand.name,
                    logoUrl: logoUrl(brand.logoFile),
                    backgroundColor: brand.backgroundColor,
                  }
                : null,
            },
            201,
          );
        }
        return c.json({ ...created, brand: null }, 201);
      } catch (error) {
        if (pgErrorCode(error) === "23503") {
          return c.json(
            { error: "Referenced userId or brandId does not exist" },
            400,
          );
        }
        throw error;
      }
    },
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a card by id",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: resolver(cardSchema) } },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        404: {
          description: "Card not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const [card] = await db
        .select()
        .from(cards)
        .where(and(eq(cards.id, id), eq(cards.userId, c.get("userId"))))
        .limit(1);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }

      return c.json(card);
    },
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a card by id",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: resolver(cardSchema) } },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        404: {
          description: "Card not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator("param", idParamSchema),
    validator("json", cardWriteSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const [updated] = await db
          .update(cards)
          .set({
            brandId: body.brandId ?? null,
          })
          .where(and(eq(cards.id, id), eq(cards.userId, c.get("userId"))))
          .returning();

        if (!updated) {
          return c.json({ error: "Card not found" }, 404);
        }
        return c.json(updated);
      } catch (error) {
        if (pgErrorCode(error) === "23503") {
          return c.json(
            { error: "Referenced userId or brandId does not exist" },
            400,
          );
        }
        throw error;
      }
    },
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a card by id",
      security: [{ bearerAuth: [] }],
      responses: {
        204: { description: "Successful response" },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        404: {
          description: "Card not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const [deleted] = await db
        .delete(cards)
        .where(and(eq(cards.id, id), eq(cards.userId, c.get("userId"))))
        .returning();
      if (!deleted) {
        return c.json({ error: "Card not found" }, 404);
      }

      return c.body(null, 204);
    },
  );

function pgErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  if (error instanceof Error && error.cause !== undefined) {
    return pgErrorCode(error.cause);
  }
  return undefined;
}

export default app;
