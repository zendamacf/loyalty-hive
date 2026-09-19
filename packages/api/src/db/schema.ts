import { relations, type SQL, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  integer,
  pgTable,
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
    viewCount: integer("view_count").notNull().default(0),
    lastViewedAt: timestamp("last_viewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("cards_brand_request_id_unique_idx")
      .on(table.brandRequestId)
      .where(sql`${table.brandRequestId} is not null`),
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
