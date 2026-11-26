import { relations, type SQL, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  logoFile: text("logo_file").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  backgroundColor: text("background_color").notNull(),
  defaultView: text("default_view", { enum: ["1D", "2D"] }),
});

export const brandRequests = pgTable(
  "brand_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedName: text("requested_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    url: text("url").notNull(),
    notes: text("notes"),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("brand_requests_user_normalized_pending_idx")
      .on(table.userId, table.normalizedName)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    emailVerifiedAt: timestamp("email_verified_at"),
    emailVerificationTokenHash: text("email_verification_token_hash"),
    emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
    passwordResetTokenHash: text("password_reset_token_hash"),
    passwordResetExpiresAt: timestamp("password_reset_expires_at"),
    /** JWTs issued before this time are rejected (session revocation). */
    passwordChangedAt: timestamp("password_changed_at"),
    /** Set when the user deletes the account. The row is purged after the grace period. */
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [uniqueIndex("users_email_unique_idx").on(lower(table.email))],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    integrationName: text("integration_name").notNull(),
    keyHash: text("key_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_keys_integration_name_unique_idx").on(
      table.integrationName,
    ),
  ],
);

/** Admin panel accounts. Separate from `users`: an app user is never an admin. */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** Admin sessions issued before this time are rejected. */
    passwordChangedAt: timestamp("password_changed_at"),
    /** Set to block login and all existing sessions for this admin. */
    disabledAt: timestamp("disabled_at"),
  },
  (table) => [
    uniqueIndex("admin_users_email_unique_idx").on(lower(table.email)),
  ],
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label"),
    cardNumber: text("card_number").notNull(),
    view: text("view", { enum: ["1D", "2D"] }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    brandRequestId: uuid("brand_request_id").references(
      () => brandRequests.id,
      {
        onDelete: "set null",
      },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("cards_brand_request_id_unique_idx")
      .on(table.brandRequestId)
      .where(sql`${table.brandRequestId} is not null`),
  ],
);

/** View stats for each user of a card. A row exists after the first view. */
export const cardViews = pgTable(
  "card_views",
  {
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewCount: integer("view_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.userId] })],
);

/** `card_id` is set for card scope only. */
function scopeCardCheck(table: { scope: AnyPgColumn; cardId: AnyPgColumn }) {
  return sql`(${table.scope} = 'card') = (${table.cardId} is not null)`;
}

/** `card`: one card (`card_id` is set). `account`: all cards of the owner, also cards added later. */
export const shareScopes = ["card", "account"] as const;

/**
 * Share invites. There is a row for each invite, also when no account has the
 * recipient email, so that limits and lists do not show which accounts exist.
 */
export const shareInvites = pgTable(
  "share_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope", { enum: shareScopes }).notNull(),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "cascade" }),
    /** Lowercase. */
    recipientEmail: text("recipient_email").notNull(),
    tokenHash: text("token_hash").notNull(),
    status: text("status", { enum: ["pending", "accepted", "cancelled"] })
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    /** Set when the invite email was sent. Null when no email was sent. */
    emailedAt: timestamp("emailed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("share_invites_scope_card_check", scopeCardCheck(table)),
    uniqueIndex("share_invites_token_hash_unique_idx").on(table.tokenHash),
    index("share_invites_owner_created_idx").on(table.ownerId, table.createdAt),
    index("share_invites_recipient_emailed_idx").on(
      table.recipientEmail,
      table.emailedAt,
    ),
  ],
);

/** Accepted shares. The recipient can see the cards but cannot change them. */
export const cardShares = pgTable(
  "card_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope", { enum: shareScopes }).notNull(),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("card_shares_scope_card_check", scopeCardCheck(table)),
    uniqueIndex("card_shares_account_unique_idx")
      .on(table.ownerId, table.recipientId)
      .where(sql`${table.scope} = 'account'`),
    uniqueIndex("card_shares_card_unique_idx")
      .on(table.cardId, table.recipientId)
      .where(sql`${table.scope} = 'card'`),
    index("card_shares_recipient_idx").on(table.recipientId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  cards: many(cards),
  brandRequests: many(brandRequests),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  cards: many(cards),
  brandRequests: many(brandRequests),
}));

export const brandRequestsRelations = relations(
  brandRequests,
  ({ one, many }) => ({
    user: one(users, {
      fields: [brandRequests.userId],
      references: [users.id],
    }),
    brand: one(brands, {
      fields: [brandRequests.brandId],
      references: [brands.id],
    }),
    cards: many(cards),
  }),
);

export const cardsRelations = relations(cards, ({ one }) => ({
  user: one(users, {
    fields: [cards.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [cards.brandId],
    references: [brands.id],
  }),
  brandRequest: one(brandRequests, {
    fields: [cards.brandRequestId],
    references: [brandRequests.id],
  }),
}));

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
