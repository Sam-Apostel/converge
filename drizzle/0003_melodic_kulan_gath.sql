CREATE TABLE "question_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "promoted_discussion_id" text;--> statement-breakpoint
ALTER TABLE "question_vote" ADD CONSTRAINT "question_vote_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_vote" ADD CONSTRAINT "question_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_vote_unique" ON "question_vote" USING btree ("question_id","user_id");--> statement-breakpoint
CREATE INDEX "question_vote_question_idx" ON "question_vote" USING btree ("question_id");--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_promoted_discussion_id_discussion_id_fk" FOREIGN KEY ("promoted_discussion_id") REFERENCES "public"."discussion"("id") ON DELETE set null ON UPDATE no action;