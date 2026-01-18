import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

/**
 * Categories table
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Words table
 */
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  polish: varchar("polish", { length: 500 }).notNull(),
  english: varchar("english", { length: 500 }).notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  difficulty: integer("difficulty").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Sessions table
 */
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  usedWordIds: text("used_word_ids").notNull().default("[]"), // JSON array of word IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
});

/**
 * Type exports for use in repositories
 */
export type CategoryRecord = typeof categories.$inferSelect;
export type WordRecord = typeof words.$inferSelect;
export type SessionRecord = typeof sessions.$inferSelect;
