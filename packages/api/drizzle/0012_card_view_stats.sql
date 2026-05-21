ALTER TABLE "cards" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "last_viewed_at" timestamp;