ALTER TABLE "conference_session" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "conference_session" SET "slug" = "id" WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "conference_session" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_session" ADD CONSTRAINT "conference_session_slug_unique" UNIQUE("slug");
