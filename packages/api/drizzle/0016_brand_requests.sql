CREATE TABLE "brand_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"url" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"brand_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_requests" ADD CONSTRAINT "brand_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "brand_requests" ADD CONSTRAINT "brand_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "brand_requests_user_normalized_pending_idx" ON "brand_requests" USING btree ("user_id","normalized_name") WHERE "brand_requests"."status" = 'pending';
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "brand_request_id" uuid;
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_brand_request_id_brand_requests_id_fk" FOREIGN KEY ("brand_request_id") REFERENCES "public"."brand_requests"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "cards_brand_request_id_unique_idx" ON "cards" USING btree ("brand_request_id") WHERE "cards"."brand_request_id" is not null;
