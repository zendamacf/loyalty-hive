import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Context } from "hono";

import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
} from "../common/openapi-responses.js";
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
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable(),
  createdAt: z.string(),
});

const idParamSchema = z.object({
  id: z.uuid(),
});

const cardCreateSchema = z.object({
  cardNumber: z.string(),
  label: z.string().nullable().optional(),
  view: z.enum(["1D", "2D"]).nullable().optional(),
  brandId: z.uuid().nullable().optional(),
});

const cardUpdateSchema = z.object({
  label: z.string().nullable().optional(),
  view: z.enum(["1D", "2D"]).nullable().optional(),
});

export const cardListSortSchema = z.enum([
  "alphabetical",
  "most_viewed",
  "last_viewed",
]);

export const cardListOrderSchema = z.enum(["asc", "desc"]);

const listCardsQuerySchema = z.object({
  sort: cardListSortSchema.optional().default("alphabetical"),
  order: cardListOrderSchema.optional(),
});

type CardListSort = z.infer<typeof cardListSortSchema>;
type CardListOrder = z.infer<typeof cardListOrderSchema>;

function defaultOrderForSort(sort: CardListSort): CardListOrder {
  switch (sort) {
    case "most_viewed":
    case "last_viewed":
      return "desc";
    default:
      return "asc";
  }
}

const cardAlphabeticalOrder = sql`lower(coalesce(${brands.name}, ${cards.label}, ${cards.cardNumber}))`;

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
  view: cards.view,
  brandId: cards.brandId,
  brandName: brands.name,
  brandLogoFile: brands.logoFile,
  brandBackgroundColor: brands.backgroundColor,
  viewCount: cards.viewCount,
  lastViewedAt: cards.lastViewedAt,
  createdAt: cards.createdAt,
};

type CardWithBrandRow = {
  id: string;
  userId: string;
  cardNumber: string;
  label: string | null;
  view: "1D" | "2D" | null;
  brandId: string | null;
  brandName: string | null;
  brandLogoFile: string | null;
  brandBackgroundColor: string | null;
  viewCount: number;
  lastViewedAt: Date | null;
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
    view: row.view,
    brand: row.brandId
      ? {
          id: row.brandId,
          name: row.brandName ?? "",
          logoUrl: logoUrl(row.brandLogoFile ?? ""),
          backgroundColor: row.brandBackgroundColor ?? "#000000",
        }
      : null,
    viewCount: row.viewCount,
    lastViewedAt: row.lastViewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function listCardsForUser(
  userId: string,
  sort: CardListSort,
  order: CardListOrder,
) {
  const query = cardWithBrandQuery().where(eq(cards.userId, userId));
  const alphabeticalOrder =
    order === "desc" ? desc(cardAlphabeticalOrder) : asc(cardAlphabeticalOrder);

  switch (sort) {
    case "most_viewed":
      return query.orderBy(
        order === "asc" ? asc(cards.viewCount) : desc(cards.viewCount),
        alphabeticalOrder,
      );
    case "last_viewed":
      return query.orderBy(
        order === "asc"
          ? sql`${cards.lastViewedAt} asc nulls last`
          : sql`${cards.lastViewedAt} desc nulls last`,
        alphabeticalOrder,
      );
    default:
      return query.orderBy(alphabeticalOrder);
  }
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
        200: jsonResponse("Successful response", z.array(cardSchema)),
        400: errorResponse("Invalid sort or order parameter"),
        401: errorResponse("Unauthorized"),
      },
    }),
    validator("query", listCardsQuerySchema),
    async (c) => {
      const { sort, order: orderParam } = c.req.valid("query");
      const order = orderParam ?? defaultOrderForSort(sort);
      const rows = await listCardsForUser(c.get("userId"), sort, order);
      return c.json(rows.map(toCardResponse));
    },
  )
  .post(
    "/",
    describeRoute({
      description: "Create a new card for the authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        201: jsonResponse("Successful response", cardSchema),
        401: errorResponse("Unauthorized"),
        409: errorResponse("Card for user already exists"),
        400: errorResponse("Referenced userId or brandId does not exist"),
      },
    }),
    validator("json", cardCreateSchema),
    async (c) => {
      const body = c.req.valid("json");

      try {
        const [created] = await db
          .insert(cards)
          .values({
            userId: c.get("userId"),
            cardNumber: body.cardNumber,
            label: body.label ?? null,
            view: body.view ?? null,
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
        200: jsonResponse("Successful response", cardSchema),
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
  .patch(
    "/:id",
    describeRoute({
      description: "Update a card",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", cardSchema),
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
      },
    }),
    validator("param", idParamSchema),
    validator("json", cardUpdateSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const userId = c.get("userId");

      const updates: { label?: string | null; view?: "1D" | "2D" | null } = {};
      if (body.label !== undefined) updates.label = body.label ?? null;
      if (body.view !== undefined) updates.view = body.view ?? null;

      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(cards)
          .set(updates)
          .where(and(eq(cards.id, id), eq(cards.userId, userId)))
          .returning({ id: cards.id });

        if (!updated) {
          return c.json({ error: "Card not found" }, 404);
        }
      }

      const card = await getCardForUser(userId, id);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }
      return c.json(toCardResponse(card));
    },
  )
  .post(
    "/:id/view",
    describeRoute({
      description:
        "Log a view of a card (increments view count and updates last viewed time)",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", cardSchema),
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");

      const [updated] = await db
        .update(cards)
        .set({
          viewCount: sql`${cards.viewCount} + 1`,
          lastViewedAt: new Date(),
        })
        .where(and(eq(cards.id, id), eq(cards.userId, userId)))
        .returning({ id: cards.id });

      if (!updated) {
        return c.json({ error: "Card not found" }, 404);
      }

      const card = await getCardForUser(userId, id);
      if (!card) throw new Error("Card missing after view update");
      return c.json(toCardResponse(card));
    },
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a card by id",
      security: [{ bearerAuth: [] }],
      responses: {
        204: noContentResponse(),
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
