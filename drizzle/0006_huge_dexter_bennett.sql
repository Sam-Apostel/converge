CREATE TABLE "session_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_resource" ADD CONSTRAINT "session_resource_session_id_conference_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."conference_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_resource_session_idx" ON "session_resource" USING btree ("session_id");