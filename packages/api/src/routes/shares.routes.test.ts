import { beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";

import { eq, inArray, or } from "drizzle-orm";
import {
  authBearerHeaders,
  createApiRouterApp,
  signTestToken,
} from "../../test/create-app";
import { upsertVerifiedTestUsers } from "../../test/upsert-test-users";
import { hashShareToken } from "../common/card-sharing";
import { SHARE_LIMITS } from "../common/constants";
import {
  INVALID_SHARE_LINK_MESSAGE,
  SHARE_FOR_OTHER_ACCOUNT_MESSAGE,
  SHARE_INVITE_SENT_MESSAGE,
  SHARE_LINK_EXPIRED_MESSAGE,
} from "../common/error";
import * as mail from "../common/mail/send-templated-email";
import { db } from "../db/client";
import {
  cardShares,
  cards,
  cardViews,
  shareInvites,
  users,
} from "../db/schema";

/** Dedicated ids and emails: do not reuse other suites' fixtures. */
const OWNER_ID = "a0000000-0000-4000-8000-000000000152";
const RECIPIENT_ID = "a0000000-0000-4000-8000-000000000153";
const OTHER_ID = "a0000000-0000-4000-8000-000000000154";
const UNVERIFIED_ID = "a0000000-0000-4000-8000-000000000155";
const OWNER_EMAIL = "share.owner@example.com";
const RECIPIENT_EMAIL = "share.recipient@example.com";
const OTHER_EMAIL = "share.other@example.com";
const UNVERIFIED_EMAIL = "share.unverified@example.com";
const UNKNOWN_EMAIL = "share.nobody@example.com";
const CARD_A = "b0000000-0000-4000-8000-000000000152";
const CARD_B = "b0000000-0000-4000-8000-000000000153";
const OTHER_CARD = "b0000000-0000-4000-8000-000000000154";
const TOKEN = "share-token-for-tests";
const DAY_MS = 24 * 60 * 60 * 1000;

let app: ReturnType<typeof createApiRouterApp>;
let ownerToken: string;
let recipientToken: string;
let otherToken: string;

function request(method: string, path: string, token: string, body?: unknown) {
  return app.request(`/api/v1${path}`, {
    method,
    headers: authBearerHeaders(token, { "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function invite(body: unknown, token = ownerToken) {
  return request("POST", "/shares", token, body);
}

function ownerInvites() {
  return db
    .select()
    .from(shareInvites)
    .where(eq(shareInvites.ownerId, OWNER_ID));
}

async function seedInvite(
  values: Partial<typeof shareInvites.$inferInsert> = {},
) {
  const [row] = await db
    .insert(shareInvites)
    .values({
      ownerId: OWNER_ID,
      scope: "card",
      cardId: CARD_A,
      recipientEmail: RECIPIENT_EMAIL,
      tokenHash: hashShareToken(crypto.randomUUID()),
      expiresAt: new Date(Date.now() + DAY_MS),
      ...values,
    })
    .returning();
  return row;
}

async function seedShare(values: Partial<typeof cardShares.$inferInsert> = {}) {
  const [row] = await db
    .insert(cardShares)
    .values({
      ownerId: OWNER_ID,
      recipientId: RECIPIENT_ID,
      scope: "card",
      cardId: CARD_A,
      ...values,
    })
    .returning();
  return row;
}

async function recipientCards() {
  const response = await request("GET", "/cards", recipientToken);
  expect(response.status).toBe(200);
  return (await response.json()) as Array<{
    id: string;
    ownership: string;
    sharedBy: string | null;
    viewCount: number;
  }>;
}

beforeAll(async () => {
  app = createApiRouterApp();
  ownerToken = await signTestToken(OWNER_ID);
  recipientToken = await signTestToken(RECIPIENT_ID);
  otherToken = await signTestToken(OTHER_ID);

  await upsertVerifiedTestUsers([
    { id: OWNER_ID, email: OWNER_EMAIL, passwordHash: "x" },
    { id: RECIPIENT_ID, email: RECIPIENT_EMAIL, passwordHash: "x" },
    { id: OTHER_ID, email: OTHER_EMAIL, passwordHash: "x" },
  ]);
  await db
    .insert(users)
    .values({ id: UNVERIFIED_ID, email: UNVERIFIED_EMAIL, passwordHash: "x" })
    .onConflictDoNothing();
});

beforeEach(async () => {
  const ids = [OWNER_ID, RECIPIENT_ID, OTHER_ID];
  await db.delete(shareInvites).where(inArray(shareInvites.ownerId, ids));
  await db.delete(cardShares).where(inArray(cardShares.ownerId, ids));
  await db.delete(cards).where(inArray(cards.userId, ids));
  await db.update(users).set({ deletedAt: null }).where(eq(users.id, OWNER_ID));
  await db.insert(cards).values([
    { id: CARD_A, userId: OWNER_ID, cardNumber: "card-a", label: "A" },
    { id: CARD_B, userId: OWNER_ID, cardNumber: "card-b", label: "B" },
    { id: OTHER_CARD, userId: OTHER_ID, cardNumber: "other", label: "Other" },
  ]);
});

describe("POST /shares", () => {
  it("sends an invite email to a verified account", async () => {
    const response = await invite({
      scope: "card",
      cardId: CARD_A,
      email: "  Share.Recipient@Example.com ",
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      message: SHARE_INVITE_SENT_MESSAGE,
    });
    const [row] = await ownerInvites();
    expect(row).toMatchObject({
      scope: "card",
      cardId: CARD_A,
      recipientEmail: RECIPIENT_EMAIL,
      status: "pending",
    });
    expect(row?.emailedAt).toBeInstanceOf(Date);
  });

  it("gives the same response for unknown and unverified emails, with no email", async () => {
    for (const email of [UNKNOWN_EMAIL, UNVERIFIED_EMAIL]) {
      const response = await invite({ scope: "account", email });
      expect(response.status).toBe(202);
      expect(await response.json()).toEqual({
        message: SHARE_INVITE_SENT_MESSAGE,
      });
    }

    const rows = await ownerInvites();
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.emailedAt === null)).toBe(true);
  });

  it("does nothing for a repeat invite or a self-invite", async () => {
    const body = { scope: "card", cardId: CARD_A, email: RECIPIENT_EMAIL };
    await invite(body);
    expect((await invite(body)).status).toBe(202);
    expect(
      (await invite({ scope: "account", email: OWNER_EMAIL })).status,
    ).toBe(202);

    expect(await ownerInvites()).toHaveLength(1);
  });

  it("makes a cancelled invite pending again and sends no new email", async () => {
    const emailedAt = new Date(Date.now() - 60_000);
    const earlier = await seedInvite({ status: "cancelled", emailedAt });

    const response = await invite({
      scope: "card",
      cardId: CARD_A,
      email: RECIPIENT_EMAIL,
    });

    expect(response.status).toBe(202);
    const rows = await ownerInvites();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: earlier?.id,
      status: "pending",
      emailedAt,
    });
  });

  it("sends 1 email from an owner to a recipient in 24 hours", async () => {
    await seedInvite({ emailedAt: new Date(Date.now() - 60_000) });

    await invite({ scope: "card", cardId: CARD_B, email: RECIPIENT_EMAIL });

    const [row] = (await ownerInvites()).filter((r) => r.cardId === CARD_B);
    expect(row?.emailedAt).toBeNull();
  });

  it("sends at most the daily maximum of emails to one recipient from all owners", async () => {
    for (let i = 0; i < SHARE_LIMITS.maxEmailsPerRecipientPerDay; i++) {
      await seedInvite({
        ownerId: OTHER_ID,
        scope: "account",
        cardId: null,
        status: "cancelled",
        emailedAt: new Date(),
      });
    }

    await invite({ scope: "account", email: RECIPIENT_EMAIL });

    const [row] = await ownerInvites();
    expect(row?.emailedAt).toBeNull();
  });

  it("clears emailedAt when the email fails, so the owner can send it again", async () => {
    const send = spyOn(mail, "sendTemplatedEmail").mockRejectedValueOnce(
      new Error("Resend down"),
    );
    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      await invite({ scope: "account", email: RECIPIENT_EMAIL });
      expect(send).toHaveBeenCalledTimes(1);

      let row = (await ownerInvites())[0];
      for (let i = 0; i < 50 && row?.emailedAt; i++) {
        await Bun.sleep(10);
        row = (await ownerInvites())[0];
      }
      expect(row?.emailedAt).toBeNull();
    } finally {
      send.mockRestore();
      error.mockRestore();
    }
  });

  it("checks the recipient limit before it makes a cancelled invite pending again", async () => {
    await seedInvite({ status: "cancelled", emailedAt: new Date() });
    await seedShare({ recipientId: OTHER_ID });
    for (let i = 0; i < SHARE_LIMITS.maxRecipients - 1; i++) {
      await seedInvite({ recipientEmail: `nobody.${i}@example.com` });
    }

    const response = await invite({
      scope: "card",
      cardId: CARD_A,
      email: RECIPIENT_EMAIL,
    });
    expect(response.status).toBe(409);
  });

  it("returns 404 for a card of another user", async () => {
    const response = await invite({
      scope: "card",
      cardId: OTHER_CARD,
      email: RECIPIENT_EMAIL,
    });
    expect(response.status).toBe(404);
  });

  it("returns 400 when a card share has no cardId", async () => {
    const response = await invite({ scope: "card", email: RECIPIENT_EMAIL });
    expect(response.status).toBe(400);
  });

  it("limits pending invites, also for unknown emails", async () => {
    for (let i = 0; i < SHARE_LIMITS.maxPendingInvites; i++) {
      await seedInvite({ recipientEmail: `nobody.${i}@example.com` });
    }

    const response = await invite({ scope: "account", email: UNKNOWN_EMAIL });
    expect(response.status).toBe(429);
  });

  it("counts cancelled invites in the daily limit", async () => {
    for (let i = 0; i < SHARE_LIMITS.maxInvitesPerDay; i++) {
      await seedInvite({
        recipientEmail: `nobody.${i}@example.com`,
        status: "cancelled",
      });
    }

    const response = await invite({ scope: "account", email: UNKNOWN_EMAIL });
    expect(response.status).toBe(429);
  });

  it("limits the recipients of a card", async () => {
    await seedShare();
    for (let i = 0; i < SHARE_LIMITS.maxRecipients - 1; i++) {
      await seedInvite({ recipientEmail: `nobody.${i}@example.com` });
    }

    const response = await invite({
      scope: "card",
      cardId: CARD_A,
      email: OTHER_EMAIL,
    });
    expect(response.status).toBe(409);
  });
});

describe("share lists and cancel", () => {
  it("lists pending invites and shares for the owner, and shares for the recipient", async () => {
    await invite({ scope: "account", email: UNKNOWN_EMAIL });
    const share = await seedShare();

    const outgoing = await request("GET", "/shares/outgoing", ownerToken);
    expect(outgoing.status).toBe(200);
    expect(await outgoing.json()).toMatchObject({
      invites: [{ scope: "account", cardId: null, email: UNKNOWN_EMAIL }],
      shares: [{ id: share?.id, scope: "card", email: RECIPIENT_EMAIL }],
    });

    const incoming = await request("GET", "/shares/incoming", recipientToken);
    expect(await incoming.json()).toMatchObject([
      { id: share?.id, cardId: CARD_A, email: OWNER_EMAIL },
    ]);
  });

  it("cancels a pending invite, so its link stops working", async () => {
    const row = await seedInvite({ tokenHash: hashShareToken(TOKEN) });

    const response = await request(
      "DELETE",
      `/shares/invites/${row?.id}`,
      ownerToken,
    );
    expect(response.status).toBe(204);
    expect(
      (await request("DELETE", `/shares/invites/${row?.id}`, ownerToken))
        .status,
    ).toBe(404);

    const accept = await request("POST", "/shares/accept", recipientToken, {
      token: TOKEN,
    });
    expect(accept.status).toBe(410);
  });

  it("stops sharing a card and cancels its invites when the owner deletes it", async () => {
    await seedShare();
    const pending = await seedInvite({ recipientEmail: UNKNOWN_EMAIL });

    const response = await request("DELETE", `/cards/${CARD_A}`, ownerToken);
    expect(response.status).toBe(204);

    const outgoing = await request("GET", "/shares/outgoing", ownerToken);
    expect(await outgoing.json()).toEqual({ invites: [], shares: [] });
    const [row] = await db
      .select({ status: shareInvites.status })
      .from(shareInvites)
      .where(eq(shareInvites.id, pending?.id ?? ""));
    expect(row?.status).toBe("cancelled");
  });
});

describe("preview and accept", () => {
  it("shows the invite to the recipient", async () => {
    await seedInvite({
      scope: "account",
      cardId: null,
      tokenHash: hashShareToken(TOKEN),
    });

    const response = await request("POST", "/shares/preview", recipientToken, {
      token: TOKEN,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      scope: "account",
      ownerEmail: OWNER_EMAIL,
    });
  });

  it("returns clear errors for wrong, other-account and expired links", async () => {
    await seedInvite({ tokenHash: hashShareToken(TOKEN) });
    await seedInvite({
      tokenHash: hashShareToken("expired"),
      expiresAt: new Date(Date.now() - 1000),
    });

    const cases = [
      [recipientToken, "wrong", 400, INVALID_SHARE_LINK_MESSAGE],
      [otherToken, TOKEN, 403, SHARE_FOR_OTHER_ACCOUNT_MESSAGE],
      [ownerToken, TOKEN, 403, SHARE_FOR_OTHER_ACCOUNT_MESSAGE],
      [recipientToken, "expired", 410, SHARE_LINK_EXPIRED_MESSAGE],
    ] as const;
    for (const [token, shareToken, status, error] of cases) {
      for (const path of ["/shares/preview", "/shares/accept"]) {
        const response = await request("POST", path, token, {
          token: shareToken,
        });
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error });
      }
    }
  });

  it("accepts a card invite one time and shows the card read-only", async () => {
    await seedInvite({ tokenHash: hashShareToken(TOKEN) });

    const accept = await request("POST", "/shares/accept", recipientToken, {
      token: TOKEN,
    });
    expect(accept.status).toBe(204);
    const again = await request("POST", "/shares/accept", recipientToken, {
      token: TOKEN,
    });
    expect(again.status).toBe(410);

    const list = await recipientCards();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: CARD_A,
      ownership: "shared",
      sharedBy: OWNER_EMAIL,
    });

    const patch = await request("PATCH", `/cards/${CARD_A}`, recipientToken, {
      label: "Mine now",
    });
    expect(patch.status).toBe(404);
    const del = await request("DELETE", `/cards/${CARD_A}`, recipientToken);
    expect(del.status).toBe(404);
  });

  it("does not accept an invite for a deleted card", async () => {
    await seedInvite({ tokenHash: hashShareToken(TOKEN) });
    await db
      .update(cards)
      .set({ deletedAt: new Date() })
      .where(eq(cards.id, CARD_A));

    const accept = await request("POST", "/shares/accept", recipientToken, {
      token: TOKEN,
    });
    expect(accept.status).toBe(410);
  });
});

describe("shared cards", () => {
  it("shows all owner cards for an account share, also cards added later", async () => {
    await seedShare({ scope: "account", cardId: null });
    await seedShare({ scope: "card", cardId: CARD_A });

    const created = await request("POST", "/cards", ownerToken, {
      cardNumber: "card-new",
      label: "New",
    });
    const { id: newCardId } = (await created.json()) as { id: string };

    const ids = (await recipientCards()).map((card) => card.id).sort();
    expect(ids).toEqual([CARD_A, CARD_B, newCardId].sort());
  });

  it("shows owned cards as owned", async () => {
    const response = await request("GET", `/cards/${CARD_A}`, ownerToken);
    expect(await response.json()).toMatchObject({
      ownership: "owned",
      sharedBy: null,
    });
  });

  it("keeps view stats for each user", async () => {
    await seedShare();
    await db.delete(cardViews).where(eq(cardViews.cardId, CARD_A));

    const view = await request("POST", `/cards/${CARD_A}/view`, recipientToken);
    expect(view.status).toBe(200);
    expect(await view.json()).toMatchObject({ viewCount: 1 });

    const owner = await request("GET", `/cards/${CARD_A}`, ownerToken);
    expect(await owner.json()).toMatchObject({ viewCount: 0 });
  });

  it("stops access at once when the owner revokes or the recipient leaves", async () => {
    const first = await seedShare();
    expect(
      (await request("DELETE", `/shares/${first?.id}`, otherToken)).status,
    ).toBe(404);
    expect(
      (await request("DELETE", `/shares/${first?.id}`, ownerToken)).status,
    ).toBe(204);
    expect(await recipientCards()).toHaveLength(0);
    expect(
      (await request("GET", `/cards/${CARD_A}`, recipientToken)).status,
    ).toBe(404);

    const second = await seedShare();
    expect(
      (await request("DELETE", `/shares/${second?.id}`, recipientToken)).status,
    ).toBe(204);
    expect(await recipientCards()).toHaveLength(0);
  });

  it("hides shared cards when the owner deletes the account", async () => {
    await seedShare({ scope: "account", cardId: null });
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, OWNER_ID));

    expect(await recipientCards()).toHaveLength(0);
    const incoming = await request("GET", "/shares/incoming", recipientToken);
    expect(await incoming.json()).toEqual([]);
  });

  it("removes shares and invites when the owner is purged", async () => {
    await seedShare();
    await seedInvite();
    await db.delete(users).where(eq(users.id, OWNER_ID));

    const remaining = await db
      .select()
      .from(cardShares)
      .where(
        or(eq(cardShares.ownerId, OWNER_ID), eq(cardShares.cardId, CARD_A)),
      );
    expect(remaining).toHaveLength(0);
    expect(
      await db
        .select()
        .from(shareInvites)
        .where(eq(shareInvites.ownerId, OWNER_ID)),
    ).toHaveLength(0);

    await upsertVerifiedTestUsers({
      id: OWNER_ID,
      email: OWNER_EMAIL,
      passwordHash: "x",
    });
  });
});
