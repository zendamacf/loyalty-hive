import { and, asc, desc, eq, exists, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
import {
  brandRequests,
  brands,
  cardShares,
  cards,
  cardViews,
  users,
} from "../db/schema.js";
import {
  requireEmailVerified,
  requireUserAuth,
} from "../middleware/auth.middleware.js";

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
  /** `shared`: another account shared the card with you. You cannot change it. */
  ownership: z.enum(["owned", "shared"]),
  /** Email of the owner when `ownership` is `shared`. */
  sharedBy: z.string().nullable(),
});

const idParamSchema = z.object({
  id: z.uuid(),
});

const cardCreateSchema = z.object({
  cardNumber: z.string(),
  label: z.string().nullable().optional(),
  view: z.enum(["1D", "2D"]).nullable().optional(),
  brandId: z.uuid().nullable().optional(),
  brandRequestId: z.uuid().nullable().optional(),
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

function activeCardCondition() {
  return isNull(cards.deletedAt);
}

interface ContextVariables {
  userId: string;
}

type AppContext = Context<{ Variables: ContextVariables }>;

const owners = alias(users, "owners");

/** Cards that the user owns, and cards that other accounts shared with the user. */
function visibleCardCondition(userId: string) {
  return and(
    activeCardCondition(),
    isNull(owners.deletedAt),
    or(
      eq(cards.userId, userId),
      exists(
        db
          .select({ id: cardShares.id })
          .from(cardShares)
          .where(
            and(
              eq(cardShares.recipientId, userId),
              eq(cardShares.ownerId, cards.userId),
              or(
                eq(cardShares.scope, "account"),
                eq(cardShares.cardId, cards.id),
              ),
            ),
          ),
      ),
    ),
  );
}

/** Views of the current user. Cards with no views have no `card_views` row. */
const viewCount = sql<number>`coalesce(${cardViews.viewCount}, 0)`.mapWith(
  Number,
);

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
  viewCount,
  lastViewedAt: cardViews.lastViewedAt,
  createdAt: cards.createdAt,
  ownerEmail: owners.email,
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
  ownerEmail: string;
};

function cardWithBrandQuery(viewerId: string) {
  return db
    .select(cardWithBrandSelect)
    .from(cards)
    .innerJoin(owners, eq(owners.id, cards.userId))
    .leftJoin(brands, eq(cards.brandId, brands.id))
    .leftJoin(
      cardViews,
      and(eq(cardViews.cardId, cards.id), eq(cardViews.userId, viewerId)),
    );
}

function toCardResponse(
  row: CardWithBrandRow,
  viewerId: string,
): z.infer<typeof cardSchema> {
  const shared = row.userId !== viewerId;
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
    ownership: shared ? "shared" : "owned",
    sharedBy: shared ? row.ownerEmail : null,
  };
}

async function listCardsForUser(
  userId: string,
  sort: CardListSort,
  order: CardListOrder,
) {
  const query = cardWithBrandQuery(userId).where(visibleCardCondition(userId));
  const alphabeticalOrder =
    order === "desc" ? desc(cardAlphabeticalOrder) : asc(cardAlphabeticalOrder);

  switch (sort) {
    case "most_viewed":
      return query.orderBy(
        order === "asc" ? asc(viewCount) : desc(viewCount),
        alphabeticalOrder,
      );
    case "last_viewed":
      return query.orderBy(
        order === "asc"
          ? sql`${cardViews.lastViewedAt} asc nulls last`
          : sql`${cardViews.lastViewedAt} desc nulls last`,
        alphabeticalOrder,
      );
    default:
      return query.orderBy(alphabeticalOrder);
  }
}

/** A card that the user owns or that is shared with the user. */
async function getVisibleCard(userId: string, cardId: string) {
  const [card] = await cardWithBrandQuery(userId)
    .where(and(eq(cards.id, cardId), visibleCardCondition(userId)))
    .limit(1);
  return card;
}

type BrandRequestLinkResult =
  | {
      ok: true;
      brandRequestId: string | null;
      label: string | null;
    }
  | {
      ok: false;
      status: 400 | 409;
      error: string;
    };

async function resolveBrandRequestLink(
  userId: string,
  brandRequestId: string | null | undefined,
  brandId: string | null | undefined,
  label: string | null | undefined,
): Promise<BrandRequestLinkResult> {
  if (!brandRequestId) {
    return { ok: true, brandRequestId: null, label: label ?? null };
  }

  if (brandId) {
    return {
      ok: false,
      status: 400,
      error: "brandId and brandRequestId cannot both be set",
    };
  }

  const [request] = await db
    .select()
    .from(brandRequests)
    .where(
      and(
        eq(brandRequests.id, brandRequestId),
        eq(brandRequests.userId, userId),
        eq(brandRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    return {
      ok: false,
      status: 400,
      error: "Brand request not found or not eligible",
    };
  }

  const [linkedCard] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.brandRequestId, brandRequestId), activeCardCondition()))
    .limit(1);

  if (linkedCard) {
    return {
      ok: false,
      status: 409,
      error: "Brand request is already linked to a card",
    };
  }

  return {
    ok: true,
    brandRequestId,
    label: label ?? request.requestedName,
  };
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
  .use(requireEmailVerified)
  .get(
    "/",
    describeRoute({
      description:
        "Get your cards and the cards that other accounts shared with you",
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
      return c.json(rows.map((row) => toCardResponse(row, c.get("userId"))));
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
        400: errorResponse(
          "Referenced userId, brandId, or brandRequestId does not exist",
        ),
      },
    }),
    validator("json", cardCreateSchema),
    async (c) => {
      const body = c.req.valid("json");
      const userId = c.get("userId");

      const link = await resolveBrandRequestLink(
        userId,
        body.brandRequestId,
        body.brandId,
        body.label,
      );

      if (!link.ok) {
        return c.json({ error: link.error }, link.status);
      }

      try {
        const [created] = await db
          .insert(cards)
          .values({
            userId,
            cardNumber: body.cardNumber,
            label: link.label,
            view: body.view ?? null,
            brandId: body.brandId ?? null,
            brandRequestId: link.brandRequestId,
          })
          .returning();
        const card = await getVisibleCard(userId, created.id);
        if (!card) throw new Error("Card missing after insert");
        return c.json(toCardResponse(card, userId), 201);
      } catch (error) {
        return handleFkViolation(c, error);
      }
    },
  )
  .get(
    "/:id",
    describeRoute({
      description:
        "Get a card by id. It can be your card or a card shared with you.",
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
      const card = await getVisibleCard(c.get("userId"), id);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }
      return c.json(toCardResponse(card, c.get("userId")));
    },
  )
  .patch(
    "/:id",
    describeRoute({
      description: "Update a card. Only the owner can update a card.",
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
          .where(
            and(
              eq(cards.id, id),
              eq(cards.userId, userId),
              activeCardCondition(),
            ),
          )
          .returning({ id: cards.id });

        if (!updated) {
          return c.json({ error: "Card not found" }, 404);
        }
      }

      const card = await getVisibleCard(userId, id);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }
      return c.json(toCardResponse(card, c.get("userId")));
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

      const card = await getVisibleCard(userId, id);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }

      const now = new Date();
      const [stats] = await db
        .insert(cardViews)
        .values({ cardId: id, userId, viewCount: 1, lastViewedAt: now })
        .onConflictDoUpdate({
          target: [cardViews.cardId, cardViews.userId],
          set: {
            viewCount: sql`${cardViews.viewCount} + 1`,
            lastViewedAt: now,
          },
        })
        .returning({
          viewCount: cardViews.viewCount,
          lastViewedAt: cardViews.lastViewedAt,
        });
      return c.json(toCardResponse({ ...card, ...stats }, userId));
    },
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a card by id. Only the owner can delete a card.",
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
        .update(cards)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(cards.id, id),
            eq(cards.userId, c.get("userId")),
            activeCardCondition(),
          ),
        )
        .returning({ id: cards.id });
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
