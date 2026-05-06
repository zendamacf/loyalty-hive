import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    logoUrl: text("logo_url").notNull(),
    defaultView: text("default_view", { enum: ["1D", "2D"] }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("brands_name_unique_idx").on(table.name)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique_idx").on(table.email)],
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
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("cards_user_id_unique_idx").on(table.userId)],
);

export const usersRelations = relations(users, ({ one }) => ({
  card: one(cards, {
    fields: [users.id],
    references: [cards.userId],
  }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  user: one(users, {
    fields: [cards.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [cards.brandId],
    references: [brands.id],
  }),
}));
