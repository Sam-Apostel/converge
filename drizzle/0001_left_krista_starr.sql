CREATE TABLE "user_ai_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'ollama' NOT NULL,
	"model" text,
	"api_key_encrypted" text,
	"base_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;