import { and, eq } from "drizzle-orm";
import type { Context } from "hono";

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
  view: z.enum(["1D", "2D"]).nullable().optional(),
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

const errorJson = {
  "application/json": {
    schema: resolver(z.object({ error: z.string() })),
  },
} as const;

function errorResponse(description: string) {
  return { description, content: errorJson };
}

const fkViolationBody = {
  error: "Referenced userId or brandId does not exist",
} as const;

interface ContextVariables {
  userId: string;
}

type AppContext = Context<{ Variables: ContextVariables }>;

const cardWithBrandSelect = {
  id: cards.id,
  userId: cards.userId,
  cardNumber: cards.cardNumber,
  label: cards.label,
  brandId: cards.brandId,
  defaultView: brands.defaultView,
  brandName: brands.name,
  brandLogoFile: brands.logoFile,
  brandBackgroundColor: brands.backgroundColor,
  createdAt: cards.createdAt,
};

type CardWithBrandRow = {
  id: string;
  userId: string;
  cardNumber: string;
  label: string | null;
  brandId: string | null;
  defaultView: "1D" | "2D" | null;
  brandName: string | null;
  brandLogoFile: string | null;
  brandBackgroundColor: string | null;
  createdAt: Date;
};

function cardWithBrandQuery() {
  return db
    .select(cardWithBrandSelect)
    .from(cards)
    .leftJoin(brands, eq(cards.brandId, brands.id));
}

function toCardResponse(row: CardWithBrandRow): z.infer<typeof cardSchema> {
  return {
    id: row.id,
    userId: row.userId,
    cardNumber: row.cardNumber,
    label: row.label,
    view: row.defaultView ?? null,
    brand: row.brandId
      ? {
          id: row.brandId,
          name: row.brandName ?? "",
          logoUrl: logoUrl(row.brandLogoFile ?? ""),
          backgroundColor: row.brandBackgroundColor ?? "#000000",
        }
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function listCardsForUser(userId: string) {
  return cardWithBrandQuery().where(eq(cards.userId, userId));
}

async function getCardForUser(userId: string, cardId: string) {
  const [card] = await cardWithBrandQuery()
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1);
  return card;
}

function respondFkViolation(c: AppContext) {
  return c.json(fkViolationBody, 400);
}

function handleFkViolation(c: AppContext, error: unknown) {
  if (pgErrorCode(error) === "23503") {
    return respondFkViolation(c);
  }
  throw error;
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
        401: errorResponse("Unauthorized"),
      },
    }),
    async (c) => {
      const rows = await listCardsForUser(c.get("userId"));
      return c.json(rows.map(toCardResponse));
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
        401: errorResponse("Unauthorized"),
        409: errorResponse("Card for user already exists"),
        400: errorResponse("Referenced userId or brandId does not exist"),
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
        const card = await getCardForUser(c.get("userId"), created.id);
        if (!card) throw new Error("Card missing after insert");
        return c.json(toCardResponse(card), 201);
      } catch (error) {
        return handleFkViolation(c, error);
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
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const card = await getCardForUser(c.get("userId"), id);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }
      return c.json(toCardResponse(card));
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
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
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
        const card = await getCardForUser(c.get("userId"), updated.id);
        if (!card) throw new Error("Card missing after update");
        return c.json(toCardResponse(card));
      } catch (error) {
        return handleFkViolation(c, error);
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
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
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
