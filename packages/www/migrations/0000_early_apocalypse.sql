-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migraitons
/*
DO $$ BEGIN
 CREATE TYPE "aal_level" AS ENUM('aal3', 'aal2', 'aal1');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "factor_status" AS ENUM('verified', 'unverified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "factor_type" AS ENUM('webauthn', 'totp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "key_status" AS ENUM('expired', 'invalid', 'valid', 'default');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "key_type" AS ENUM('stream_xchacha20', 'secretstream', 'secretbox', 'kdf', 'generichash', 'shorthash', 'auth', 'hmacsha256', 'hmacsha512', 'aead-det', 'aead-ietf');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "pool_participants" (
	"user_id" uuid NOT NULL,
	"pool_id" uuid NOT NULL
);
ALTER TABLE "pool_participants" ADD CONSTRAINT "pool_participants_pkey" PRIMARY KEY("user_id","pool_id");

CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid NOT NULL,
	"updated_at" timestamp with time zone,
	"username" text,
	"full_name" text,
	"avatar_url" text,
	"website" text
);

CREATE TABLE IF NOT EXISTS "event_categories" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "pools" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"author_id" uuid DEFAULT auth.uid() NOT NULL,
	"event_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_category_noms" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"primary_text" text NOT NULL,
	"secondary_text" text,
	"event_id" uuid NOT NULL,
	"event_category_id" uuid
);

CREATE TABLE IF NOT EXISTS "pool_picks" (
	"user_id" uuid NOT NULL,
	"event_category_nom_id" uuid NOT NULL,
	"pool_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"event_category_id" uuid NOT NULL
);
ALTER TABLE "pool_picks" ADD CONSTRAINT "pool_picks_pkey" PRIMARY KEY("user_id","event_category_nom_id","pool_id","event_category_id");

DO $$ BEGIN
 ALTER TABLE pool_participants ADD CONSTRAINT pool_participants_pool_id_fkey FOREIGN KEY ("pool_id") REFERENCES pools("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE event_categories ADD CONSTRAINT event_categories_event_id_fkey FOREIGN KEY ("event_id") REFERENCES events("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE pools ADD CONSTRAINT pools_event_id_fkey FOREIGN KEY ("event_id") REFERENCES events("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE event_category_noms ADD CONSTRAINT event_category_noms_event_category_id_fkey FOREIGN KEY ("event_category_id") REFERENCES event_categories("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE event_category_noms ADD CONSTRAINT event_category_noms_event_id_fkey FOREIGN KEY ("event_id") REFERENCES events("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE pool_picks ADD CONSTRAINT pool_picks_event_category_id_fkey FOREIGN KEY ("event_category_id") REFERENCES event_categories("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE pool_picks ADD CONSTRAINT pool_picks_event_category_nom_id_fkey FOREIGN KEY ("event_category_nom_id") REFERENCES event_category_noms("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE pool_picks ADD CONSTRAINT pool_picks_pool_id_fkey FOREIGN KEY ("pool_id") REFERENCES pools("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles ("username");
CREATE UNIQUE INDEX IF NOT EXISTS unique_name_event ON event_categories ("name","event_id");
CREATE UNIQUE INDEX IF NOT EXISTS unique_cataegory_nom ON event_category_noms ("primary_text","event_category_id");
CREATE UNIQUE INDEX IF NOT EXISTS constraint_user_id_pool_id_event_category_id ON pool_picks ("user_id","pool_id","event_category_id");
*/