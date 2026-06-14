CREATE TABLE "meetup" (
	"id" text PRIMARY KEY NOT NULL,
	"discussion_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp,
	"location" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetup_attendee" (
	"id" text PRIMARY KEY NOT NULL,
	"meetup_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetup" ADD CONSTRAINT "meetup_discussion_id_discussion_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup" ADD CONSTRAINT "meetup_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_attendee" ADD CONSTRAINT "meetup_attendee_meetup_id_meetup_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_attendee" ADD CONSTRAINT "meetup_attendee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meetup_discussion_idx" ON "meetup" USING btree ("discussion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meetup_attendee_unique" ON "meetup_attendee" USING btree ("meetup_id","user_id");