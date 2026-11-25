CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"password_changed_at" timestamp,
	"disabled_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_unique_idx" ON "admin_users" USING btree (lower("email"));