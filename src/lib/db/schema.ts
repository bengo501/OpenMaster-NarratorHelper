import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { ActorSheet } from "@/lib/actors/sheet";
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

// ---------------------------------------------------------------------------
// Atores (PC e NPC unificados) — M2
// ---------------------------------------------------------------------------

export const actorKind = pgEnum("actor_kind", ["pc", "npc"]);

export const actors = pgTable(
  "actor",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    kind: actorKind("kind").notNull().default("npc"),
    name: text("name").notNull(),
    concept: text("concept"),
    /** Jogador, quando for um PC. */
    playerName: text("player_name"),
    description: text("description"),
    /** Notas ocultas do mestre. */
    notes: text("notes"),
    /** Ficha dirigida pelo template (atributos/recursos). */
    sheet: jsonb("sheet")
      .$type<ActorSheet>()
      .notNull()
      .default(sql`'{"attributes":{},"resources":{}}'::jsonb`),
    /** Campos narrativos flexíveis (motivação, segredo, atitude…). */
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
  (table) => [
    index("actor_campaign_idx").on(table.campaignId),
    index("actor_owner_idx").on(table.ownerId),
  ],
);

export type Actor = typeof actors.$inferSelect;
export type NewActor = typeof actors.$inferInsert;

// ---------------------------------------------------------------------------
// Locais (hierárquicos) — M2
// ---------------------------------------------------------------------------

export const locations = pgTable(
  "location",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    /** Pai na hierarquia (continente > região > cidade > …). */
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    /** Tipo livre (cidade, masmorra, taverna…). */
    type: text("type"),
    description: text("description"),
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
  (table) => [
    index("location_campaign_idx").on(table.campaignId),
    index("location_parent_idx").on(table.parentId),
  ],
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

// ---------------------------------------------------------------------------
// Sessões e Cenas — M3
// ---------------------------------------------------------------------------

export const sessionStatus = pgEnum("session_status", [
  "planned",
  "running",
  "done",
  "canceled",
]);

export const sessions = pgTable(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    title: text("title").notNull(),
    sessionDate: date("session_date"),
    status: sessionStatus("status").notNull().default("planned"),
    /** O que o mestre planejou. */
    plannedSummary: text("planned_summary"),
    /** O que de fato aconteceu. */
    actualSummary: text("actual_summary"),
    /** Notas privadas do mestre. */
    gmNotes: text("gm_notes"),
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
  (table) => [
    index("session_campaign_idx").on(table.campaignId),
    index("session_owner_idx").on(table.ownerId),
  ],
);

export type GameSession = typeof sessions.$inferSelect;
export type NewGameSession = typeof sessions.$inferInsert;

export const sceneStatus = pgEnum("scene_status", [
  "planned",
  "done",
  "skipped",
]);

export const scenes = pgTable(
  "scene",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: sceneStatus("status").notNull().default("planned"),
    order: integer("order").notNull().default(0),
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
  (table) => [
    index("scene_session_idx").on(table.sessionId),
    index("scene_owner_idx").on(table.ownerId),
  ],
);

export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;

// ---------------------------------------------------------------------------
// Notas — M3
// ---------------------------------------------------------------------------

export const notes = pgTable(
  "note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    title: text("title"),
    body: text("body").notNull().default(""),
    pinned: boolean("pinned").notNull().default(false),
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
  (table) => [
    index("note_campaign_idx").on(table.campaignId),
    index("note_owner_idx").on(table.ownerId),
  ],
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
