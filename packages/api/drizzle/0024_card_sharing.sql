CREATE TABLE "card_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"card_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_shares_scope_card_check" CHECK (("card_shares"."scope" = 'card') = ("card_shares"."card_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "share_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"card_id" uuid,
	"recipient_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"emailed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_invites_scope_card_check" CHECK (("share_invites"."scope" = 'card') = ("share_invites"."card_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "card_shares" ADD CONSTRAINT "card_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_shares" ADD CONSTRAINT "card_shares_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_shares" ADD CONSTRAINT "card_shares_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_invites" ADD CONSTRAINT "share_invites_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_invites" ADD CONSTRAINT "share_invites_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "card_shares_account_unique_idx" ON "card_shares" USING btree ("owner_id","recipient_id") WHERE "card_shares"."scope" = 'account';--> statement-breakpoint
CREATE UNIQUE INDEX "card_shares_card_unique_idx" ON "card_shares" USING btree ("card_id","recipient_id") WHERE "card_shares"."scope" = 'card';--> statement-breakpoint
CREATE INDEX "card_shares_recipient_idx" ON "card_shares" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "share_invites_token_hash_unique_idx" ON "share_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "share_invites_owner_created_idx" ON "share_invites" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "share_invites_recipient_emailed_idx" ON "share_invites" USING btree ("recipient_email","emailed_at");