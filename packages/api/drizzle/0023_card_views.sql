CREATE TABLE "card_views" (
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp NOT NULL,
	CONSTRAINT "card_views_card_id_user_id_pk" PRIMARY KEY("card_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "card_views" ADD CONSTRAINT "card_views_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_views" ADD CONSTRAINT "card_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "card_views" ("card_id", "user_id", "view_count", "last_viewed_at")
SELECT "id", "user_id", "view_count", coalesce("last_viewed_at", "created_at")
FROM "cards"
WHERE "view_count" > 0;--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "last_viewed_at";