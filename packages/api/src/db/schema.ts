import { relations, type SQL, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
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
});

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

export const cards = pgTable("cards", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
