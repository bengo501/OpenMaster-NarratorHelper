import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { SystemTemplate } from "@/lib/templates/schema";

/**
 * Schema do banco (Drizzle / Postgres / Supabase).
 *
 * Padrão híbrido: colunas fixas universais + coluna `data` (JSONB) para
 * campos dirigidos pelo template. IDs em UUID para facilitar sync/nuvem.
 *
 * M1 cobre `campaign`. Atores, locais, sessões, cenas, notas, combate, etc.
 * entram nos marcos seguintes (M2, M3, M5).
 */

export const campaignStatus = pgEnum("campaign_status", [
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const campaigns = pgTable(
  "campaign",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** auth.users.id do dono (Supabase). */
    ownerId: uuid("owner_id").notNull(),
    name: text("name").notNull(),
    /** key do template usado (ex.: "d20-fantasy"). */
    systemKey: text("system_key").notNull(),
    /** Cópia do template no momento da criação — campanha autocontida. */
    systemSnapshot: jsonb("system_snapshot").$type<SystemTemplate>().notNull(),
    description: text("description"),
    tone: text("tone"),
    genre: text("genre"),
    status: campaignStatus("status").notNull().default("planning"),
    setting: text("setting"),
    /** Campos flexíveis dirigidos pelo template / uso futuro. */
    data: jsonb("data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("campaign_owner_idx").on(table.ownerId)],
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
