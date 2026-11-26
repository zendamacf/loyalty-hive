import { createHash, randomBytes } from "node:crypto";

import { and, desc, eq, gt, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  cardShares,
  cards,
  lower,
  shareInvites,
  type shareScopes,
  users,
} from "../db/schema.js";
import { buildEmailLink } from "./app-links.js";
import { SHARE_INVITE_TTL_DAYS, SHARE_LIMITS } from "./constants.js";
import { sendTemplatedEmail } from "./mail/send-templated-email.js";

/**
 * Card sharing:
 * - A share gives live, read-only access to one card or to all cards of the
 *   owner. The recipient cannot change, delete or share the cards.
 * - Invites go to existing, verified accounts only. The API response is the
 *   same for all emails, and there is an invite row for each email. Thus the
 *   response, the limits and the owner's lists do not show which accounts exist.
 *   The email is sent in the background, so the response time does not show it.
 * - Token: 32 random bytes, base64url. Only the SHA-256 hash is stored. The
 *   token expires after SHARE_INVITE_TTL_DAYS and works one time.
 * - Limits (SHARE_LIMITS) count invite rows, also cancelled ones. When the
 *   owner invites again after a cancel, the earlier invite becomes pending
 *   again and no new email is sent.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ShareScope = (typeof shareScopes)[number];

export type ShareTarget =
  | { scope: "account" }
  | { scope: "card"; cardId: string };

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Rows of the same owner and target (one card, or the account). */
function sameTarget(
  table: typeof shareInvites | typeof cardShares,
  ownerId: string,
  target: ShareTarget,
) {
  return and(
    eq(table.ownerId, ownerId),
    eq(table.scope, target.scope),
    target.scope === "card" ? eq(table.cardId, target.cardId) : undefined,
  );
}

export type CreateShareInviteResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "card_not_found"
        | "too_many_pending"
        | "too_many_today"
        | "too_many_recipients";
    };

export async function createShareInvite(
  ownerId: string,
  target: ShareTarget,
  recipientEmail: string,
): Promise<CreateShareInviteResult> {
  const email = recipientEmail.trim().toLowerCase();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);

  if (target.scope === "card") {
    const card = await db.$count(
      cards,
      and(
        eq(cards.id, target.cardId),
        eq(cards.userId, ownerId),
        isNull(cards.deletedAt),
      ),
    );
    if (card === 0) return { ok: false, reason: "card_not_found" };
  }

  const [owner] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, ownerId));
  if (!owner) throw new Error("Share owner not found");
  if (owner.email.toLowerCase() === email) return { ok: true };

  const [earlierInvite] = await db
    .select({ id: shareInvites.id, status: shareInvites.status })
    .from(shareInvites)
    .where(
      and(
        sameTarget(shareInvites, ownerId, target),
        eq(shareInvites.recipientEmail, email),
        or(
          eq(shareInvites.status, "pending"),
          and(
            eq(shareInvites.status, "cancelled"),
            isNotNull(shareInvites.emailedAt),
          ),
        ),
        gt(shareInvites.expiresAt, now),
      ),
    )
    .orderBy(desc(shareInvites.createdAt))
    .limit(1);
  if (earlierInvite?.status === "pending") return { ok: true };

  const existingShares = await db.$count(
    cardShares,
    and(
      sameTarget(cardShares, ownerId, target),
      inArray(
        cardShares.recipientId,
        db
          .select({ id: users.id })
          .from(users)
          .where(eq(lower(users.email), email)),
      ),
    ),
  );
  if (existingShares > 0) return { ok: true };

  const pendingInvites = await db.$count(
    shareInvites,
    and(
      eq(shareInvites.ownerId, ownerId),
      eq(shareInvites.status, "pending"),
      gt(shareInvites.expiresAt, now),
    ),
  );
  if (pendingInvites >= SHARE_LIMITS.maxPendingInvites) {
    return { ok: false, reason: "too_many_pending" };
  }

  if (earlierInvite) {
    // The recipient has the link from the earlier email. Do not send it again.
    await db
      .update(shareInvites)
      .set({ status: "pending" })
      .where(eq(shareInvites.id, earlierInvite.id));
    return { ok: true };
  }

  const invitesToday = await db.$count(
    shareInvites,
    and(eq(shareInvites.ownerId, ownerId), gt(shareInvites.createdAt, dayAgo)),
  );
  if (invitesToday >= SHARE_LIMITS.maxInvitesPerDay) {
    return { ok: false, reason: "too_many_today" };
  }

  const recipients =
    (await db.$count(cardShares, sameTarget(cardShares, ownerId, target))) +
    (await db.$count(
      shareInvites,
      and(
        sameTarget(shareInvites, ownerId, target),
        eq(shareInvites.status, "pending"),
        gt(shareInvites.expiresAt, now),
      ),
    ));
  if (recipients >= SHARE_LIMITS.maxRecipients) {
    return { ok: false, reason: "too_many_recipients" };
  }

  const recipientAccounts = await db.$count(
    users,
    and(
      eq(lower(users.email), email),
      isNotNull(users.emailVerifiedAt),
      isNull(users.deletedAt),
    ),
  );
  const emailsFromOwner = await db.$count(
    shareInvites,
    and(
      eq(shareInvites.ownerId, ownerId),
      eq(shareInvites.recipientEmail, email),
      gt(shareInvites.emailedAt, dayAgo),
    ),
  );
  const emailsToRecipient = await db.$count(
    shareInvites,
    and(
      eq(shareInvites.recipientEmail, email),
      gt(shareInvites.emailedAt, dayAgo),
    ),
  );
  const sendEmail =
    recipientAccounts > 0 &&
    emailsFromOwner === 0 &&
    emailsToRecipient < SHARE_LIMITS.maxEmailsPerRecipientPerDay;

  const token = randomBytes(32).toString("base64url");
  await db.insert(shareInvites).values({
    ownerId,
    scope: target.scope,
    cardId: target.scope === "card" ? target.cardId : null,
    recipientEmail: email,
    tokenHash: hashShareToken(token),
    expiresAt: new Date(now.getTime() + SHARE_INVITE_TTL_DAYS * DAY_MS),
    emailedAt: sendEmail ? now : null,
  });

  if (sendEmail) {
    void sendTemplatedEmail("shareInvite", email, {
      ownerEmail: owner.email,
      scope: target.scope,
      acceptUrl: buildEmailLink("accept-share", token),
      expiresInDays: SHARE_INVITE_TTL_DAYS,
    }).catch((error) => {
      console.error("[shares] Failed to send share invite email", error);
    });
  }

  return { ok: true };
}

export type ShareInviteLookup =
  | {
      ok: true;
      invite: {
        id: string;
        ownerId: string;
        ownerEmail: string;
        scope: ShareScope;
        cardId: string | null;
        expiresAt: Date;
      };
    }
  | { ok: false; reason: "invalid" | "expired" | "wrong_account" };

/** Finds a pending invite for the user. The user email must match the invite. */
export async function findShareInviteForRecipient(
  userId: string,
  token: string,
): Promise<ShareInviteLookup> {
  const [row] = await db
    .select({
      id: shareInvites.id,
      ownerId: shareInvites.ownerId,
      ownerEmail: users.email,
      ownerDeletedAt: users.deletedAt,
      scope: shareInvites.scope,
      cardId: shareInvites.cardId,
      cardDeletedAt: cards.deletedAt,
      recipientEmail: shareInvites.recipientEmail,
      status: shareInvites.status,
      expiresAt: shareInvites.expiresAt,
    })
    .from(shareInvites)
    .innerJoin(users, eq(users.id, shareInvites.ownerId))
    .leftJoin(cards, eq(cards.id, shareInvites.cardId))
    .where(eq(shareInvites.tokenHash, hashShareToken(token)));
  if (!row) return { ok: false, reason: "invalid" };

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  if (
    userId === row.ownerId ||
    user?.email.toLowerCase() !== row.recipientEmail
  ) {
    return { ok: false, reason: "wrong_account" };
  }

  if (
    row.status !== "pending" ||
    row.expiresAt.getTime() <= Date.now() ||
    row.ownerDeletedAt ||
    row.cardDeletedAt
  ) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    invite: {
      id: row.id,
      ownerId: row.ownerId,
      ownerEmail: row.ownerEmail,
      scope: row.scope,
      cardId: row.cardId,
      expiresAt: row.expiresAt,
    },
  };
}

export async function acceptShareInvite(
  userId: string,
  token: string,
): Promise<{ ok: true } | Extract<ShareInviteLookup, { ok: false }>> {
  const found = await findShareInviteForRecipient(userId, token);
  if (!found.ok) return found;
  const { invite } = found;

  const accepted = await db.transaction(async (tx) => {
    // Matching on the status makes the token single-use if two requests race.
    const [updated] = await tx
      .update(shareInvites)
      .set({ status: "accepted" })
      .where(
        and(eq(shareInvites.id, invite.id), eq(shareInvites.status, "pending")),
      )
      .returning({ id: shareInvites.id });
    if (!updated) return false;

    await tx
      .insert(cardShares)
      .values({
        ownerId: invite.ownerId,
        recipientId: userId,
        scope: invite.scope,
        cardId: invite.cardId,
      })
      .onConflictDoNothing();
    return true;
  });

  return accepted ? { ok: true } : { ok: false, reason: "expired" };
}
