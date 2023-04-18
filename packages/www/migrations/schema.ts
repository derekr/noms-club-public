import { pgTable, pgEnum, pgSchema, AnyPgColumn, uuid, timestamp, text, foreignKey, primaryKey, uniqueIndex, boolean } from "drizzle-orm/pg-core"

export const aalLevel = pgEnum("aal_level", ['aal3', 'aal2', 'aal1'])
export const factorStatus = pgEnum("factor_status", ['verified', 'unverified'])
export const factorType = pgEnum("factor_type", ['webauthn', 'totp'])
export const keyStatus = pgEnum("key_status", ['expired', 'invalid', 'valid', 'default'])
export const keyType = pgEnum("key_type", ['stream_xchacha20', 'secretstream', 'secretbox', 'kdf', 'generichash', 'shorthash', 'auth', 'hmacsha256', 'hmacsha512', 'aead-det', 'aead-ietf'])

import { sql } from "drizzle-orm/sql"

export const events = pgTable("events", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text("name").notNull(),
});

export const poolParticipants = pgTable("pool_participants", {
	userId: uuid("user_id").notNull(),
	poolId: uuid("pool_id").notNull().references(() => pools.id),
},
(table) => {
	return {
		poolParticipantsPkey: primaryKey(table.userId, table.poolId)
	}
});

export const profiles = pgTable("profiles", {
	id: uuid("id").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	username: text("username"),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	website: text("website"),
},
(table) => {
	return {
		usernameKey: uniqueIndex("profiles_username_key").on(table.username),
	}
});

export const eventCategories = pgTable("event_categories", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	eventId: uuid("event_id").notNull().references(() => events.id),
},
(table) => {
	return {
		uniqueNameEvent: uniqueIndex("unique_name_event").on(table.name, table.eventId),
	}
});

export const pools = pgTable("pools", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text("name").notNull(),
	authorId: uuid("author_id").default(sql`auth.uid()`).notNull(),
	eventId: uuid("event_id").notNull().references(() => events.id),
});

export const poolPicks = pgTable("pool_picks", {
	userId: uuid("user_id").notNull(),
	eventCategoryNomId: uuid("event_category_nom_id").notNull().references(() => eventCategoryNoms.id),
	poolId: uuid("pool_id").notNull().references(() => pools.id),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	eventCategoryId: uuid("event_category_id").notNull().references(() => eventCategories.id),
},
(table) => {
	return {
		constraintUserIdPoolIdEventCategoryId: uniqueIndex("constraint_user_id_pool_id_event_category_id").on(table.userId, table.poolId, table.eventCategoryId),
		poolPicksPkey: primaryKey(table.userId, table.eventCategoryNomId, table.poolId, table.eventCategoryId)
	}
});

export const eventCategoryNoms = pgTable("event_category_noms", {
	id: uuid("id").default(sql`uuid_generate_v4()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	primaryText: text("primary_text").notNull(),
	secondaryText: text("secondary_text"),
	eventId: uuid("event_id").notNull().references(() => events.id),
	eventCategoryId: uuid("event_category_id").references(() => eventCategories.id),
	isWinner: boolean("is_winner"),
},
(table) => {
	return {
		uniqueCataegoryNom: uniqueIndex("unique_cataegory_nom").on(table.primaryText, table.eventCategoryId),
	}
});