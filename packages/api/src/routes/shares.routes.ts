import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import {
  acceptShareInvite,
  createShareInvite,
  findShareInviteForRecipient,
} from "../common/card-sharing.js";
import { SHARE_LIMITS } from "../common/constants.js";
import {
  INVALID_SHARE_LINK_MESSAGE,
  SHARE_FOR_OTHER_ACCOUNT_MESSAGE,
  SHARE_INVITE_SENT_MESSAGE,
  SHARE_LINK_EXPIRED_MESSAGE,
} from "../common/error.js";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
  validationErrorResponse,
} from "../common/openapi-responses.js";
import { db } from "../db/client.js";
import { cardShares, shareInvites, shareScopes, users } from "../db/schema.js";
import {
  requireEmailVerified,
  requireUserAuth,
} from "../middleware/auth.middleware.js";
import { shareCreateIpRateLimit } from "../middleware/rate-limit.middleware.js";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const createShareBodySchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("card"), cardId: z.uuid(), email: emailSchema }),
  z.object({ scope: z.literal("account"), email: emailSchema }),
]);

const tokenBodySchema = z.object({ token: z.string().min(1) });

const idParamSchema = z.object({ id: z.uuid() });

/** `email` is the other account: the recipient for outgoing shares, the owner for incoming shares. */
export const shareSchema = z.object({
  id: z.uuid(),
  scope: z.enum(shareScopes),
  cardId: z.uuid().nullable(),
  email: z.string(),
  createdAt: z.string(),
});

const shareInviteSchema = shareSchema.extend({ expiresAt: z.string() });

const outgoingSharesSchema = z.object({
  invites: z.array(shareInviteSchema),
  shares: z.array(shareSchema),
});

const invitePreviewSchema = z.object({
  scope: z.enum(shareScopes),
  ownerEmail: z.string(),
  expiresAt: z.string(),
});

const createLimitErrors = {
  too_many_pending: [429, "Too many pending invites"],
  too_many_today: [429, "Too many invites today"],
  too_many_recipients: [
    409,
    "This card or account has the maximum number of recipients",
  ],
} as const;

const inviteLookupErrors = {
  invalid: [400, INVALID_SHARE_LINK_MESSAGE],
  wrong_account: [403, SHARE_FOR_OTHER_ACCOUNT_MESSAGE],
  expired: [410, SHARE_LINK_EXPIRED_MESSAGE],
} as const;

const inviteLookupResponses = {
  400: errorResponse(`${INVALID_SHARE_LINK_MESSAGE}, or validation error`),
  401: errorResponse("Unauthorized"),
  403: errorResponse("The invite is for a different account"),
  410: errorResponse("The invite was used, has expired, or was cancelled"),
};

interface ContextVariables {
  userId: string;
}

const app = new Hono<{ Variables: ContextVariables }>()
  .use(requireUserAuth)
  .use(requireEmailVerified)
  .post(
    "/",
    shareCreateIpRateLimit,
    describeRoute({
      description: `Invite another account to see one card (\`scope: card\`) or all your cards, also cards you add later (\`scope: account\`). The response is the same whether or not an account has the email (no user enumeration). Only existing, verified accounts get an email. Limits: ${SHARE_LIMITS.maxPendingInvites} pending invites, ${SHARE_LIMITS.maxInvitesPerDay} invites in 24 hours, ${SHARE_LIMITS.maxRecipients} recipients for each card or account, and 1 email to the same recipient in 24 hours.`,
      security: [{ bearerAuth: [] }],
      responses: {
        202: jsonResponse(
          "Invite accepted for processing",
          z.object({ message: z.string() }),
        ),
        400: validationErrorResponse(),
        401: errorResponse("Unauthorized"),
        404: errorResponse("Card not found"),
        409: errorResponse(createLimitErrors.too_many_recipients[1]),
        429: errorResponse("Too many requests or invites"),
      },
    }),
    validator("json", createShareBodySchema),
    async (c) => {
      const { email, ...target } = c.req.valid("json");
      const result = await createShareInvite(c.get("userId"), target, email);
      if (!result.ok) {
        if (result.reason === "card_not_found") {
          return c.json({ error: "Card not found" }, 404);
        }
        const [status, error] = createLimitErrors[result.reason];
        return c.json({ error }, status);
      }
      return c.json({ message: SHARE_INVITE_SENT_MESSAGE }, 202);
    },
  )
  .get(
    "/outgoing",
    describeRoute({
      description:
        "Pending invites and active shares that you gave. Pending invites include invites to emails with no account.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", outgoingSharesSchema),
        401: errorResponse("Unauthorized"),
      },
    }),
    async (c) => {
      const userId = c.get("userId");
      const invites = await db
        .select()
        .from(shareInvites)
        .where(
          and(
            eq(shareInvites.ownerId, userId),
            eq(shareInvites.status, "pending"),
            gt(shareInvites.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(shareInvites.createdAt));
      const shares = await listShares("outgoing", userId);

      return c.json({
        invites: invites.map((invite) => ({
          id: invite.id,
          scope: invite.scope,
          cardId: invite.cardId,
          email: invite.recipientEmail,
          createdAt: invite.createdAt.toISOString(),
          expiresAt: invite.expiresAt.toISOString(),
        })),
        shares,
      });
    },
  )
  .get(
    "/incoming",
    describeRoute({
      description: "Active shares that other accounts gave you.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", z.array(shareSchema)),
        401: errorResponse("Unauthorized"),
      },
    }),
    async (c) => c.json(await listShares("incoming", c.get("userId"))),
  )
  .post(
    "/preview",
    describeRoute({
      description:
        "Show an invite from the emailed link before you accept it. You must be logged in with the invited email.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: jsonResponse("Successful response", invitePreviewSchema),
        ...inviteLookupResponses,
      },
    }),
    validator("json", tokenBodySchema),
    async (c) => {
      const { token } = c.req.valid("json");
      const found = await findShareInviteForRecipient(c.get("userId"), token);
      if (!found.ok) {
        const [status, error] = inviteLookupErrors[found.reason];
        return c.json({ error }, status);
      }
      return c.json({
        scope: found.invite.scope,
        ownerEmail: found.invite.ownerEmail,
        expiresAt: found.invite.expiresAt.toISOString(),
      });
    },
  )
  .post(
    "/accept",
    describeRoute({
      description:
        "Accept an invite from the emailed link. You must be logged in with the invited email. The link works one time.",
      security: [{ bearerAuth: [] }],
      responses: {
        204: noContentResponse("Invite accepted"),
        ...inviteLookupResponses,
      },
    }),
    validator("json", tokenBodySchema),
    async (c) => {
      const { token } = c.req.valid("json");
      const result = await acceptShareInvite(c.get("userId"), token);
      if (!result.ok) {
        const [status, error] = inviteLookupErrors[result.reason];
        return c.json({ error }, status);
      }
      return c.body(null, 204);
    },
  )
  .delete(
    "/invites/:id",
    describeRoute({
      description: "Cancel a pending invite that you sent.",
      security: [{ bearerAuth: [] }],
      responses: {
        204: noContentResponse(),
        401: errorResponse("Unauthorized"),
        404: errorResponse("Invite not found"),
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const [cancelled] = await db
        .update(shareInvites)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(shareInvites.id, id),
            eq(shareInvites.ownerId, c.get("userId")),
            eq(shareInvites.status, "pending"),
          ),
        )
        .returning({ id: shareInvites.id });
      if (!cancelled) return c.json({ error: "Invite not found" }, 404);
      return c.body(null, 204);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      description:
        "Stop a share. The owner can revoke it, and the recipient can leave it. Access stops at once.",
      security: [{ bearerAuth: [] }],
      responses: {
        204: noContentResponse(),
        401: errorResponse("Unauthorized"),
        404: errorResponse("Share not found"),
      },
    }),
    validator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      const [deleted] = await db
        .delete(cardShares)
        .where(
          and(
            eq(cardShares.id, id),
            or(
              eq(cardShares.ownerId, userId),
              eq(cardShares.recipientId, userId),
            ),
          ),
        )
        .returning({ id: cardShares.id });
      if (!deleted) return c.json({ error: "Share not found" }, 404);
      return c.body(null, 204);
    },
  );

/** Shares with the other account's email. Shares with deleted accounts are not shown. */
async function listShares(
  direction: "outgoing" | "incoming",
  userId: string,
): Promise<z.infer<typeof shareSchema>[]> {
  const [mine, other] =
    direction === "outgoing"
      ? [cardShares.ownerId, cardShares.recipientId]
      : [cardShares.recipientId, cardShares.ownerId];
  const rows = await db
    .select({
      id: cardShares.id,
      scope: cardShares.scope,
      cardId: cardShares.cardId,
      email: users.email,
      createdAt: cardShares.createdAt,
    })
    .from(cardShares)
    .innerJoin(users, eq(users.id, other))
    .where(and(eq(mine, userId), isNull(users.deletedAt)))
    .orderBy(desc(cardShares.createdAt));
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

export default app;
