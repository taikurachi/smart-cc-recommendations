import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const plaidConnections = pgTable("plaid_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  access_token: text("access_token").notNull(),
  item_id: text("item_id").unique().notNull(),
  institution_name: text("institution_name"),
  institution_id: text("institution_id"),
  accounts: jsonb("accounts").default([]).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_synced: timestamp("last_synced"),
  is_active: boolean("is_active").default(true).notNull(),
});

export const creditCards = pgTable("credit_cards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  institution_name: text("institution_name").notNull(),
  annual_fee: integer("annual_fee").notNull().default(0),
  tags: jsonb("tags").default([]).notNull(),
  rewards: jsonb("rewards").notNull(),
  credits: jsonb("credits").default([]).notNull(),
  benefits: jsonb("benefits").default([]).notNull(),
  image: jsonb("image"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
