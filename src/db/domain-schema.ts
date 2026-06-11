import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { user } from './auth-schema'

/**
 * Converge domain schema.
 *
 * Converge is "people-first": people and the projects they build are the
 * primary objects, with sessions, moments, questions and discussions woven
 * around them into a persistent conference knowledge graph.
 *
 * Every table uses a UUID text primary key (matching better-auth's `user.id`
 * text id) so domain rows can reference users directly.
 */

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () => timestamp('created_at').defaultNow().notNull()
const updatedAt = () =>
  timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()

/* ------------------------------------------------------------------ */
/* Conference + venue                                                  */
/* ------------------------------------------------------------------ */

export const conference = pgTable('conference', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  description: text('description'),
  timezone: text('timezone').default('UTC').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  venueName: text('venue_name'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/** A person's participation in a conference, plus their role there. */
export const conferenceMember = pgTable(
  'conference_member',
  {
    id: id(),
    conferenceId: text('conference_id')
      .notNull()
      .references(() => conference.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // attendee | speaker | organizer | sponsor
    role: text('role').notNull().default('attendee'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('conference_member_unique').on(t.conferenceId, t.userId),
    index('conference_member_conference_idx').on(t.conferenceId),
  ],
)

export const room = pgTable(
  'room',
  {
    id: id(),
    conferenceId: text('conference_id')
      .notNull()
      .references(() => conference.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    floor: text('floor'),
    capacity: integer('capacity'),
    // {lat,lng} or relative venue coords for walking-time estimates
    location: jsonb('location').$type<{ lat: number; lng: number }>(),
  },
  (t) => [index('room_conference_idx').on(t.conferenceId)],
)

/* ------------------------------------------------------------------ */
/* People — rich profiles, projects                                    */
/* ------------------------------------------------------------------ */

/** Extended profile attached 1:1 to a better-auth user. */
export const profile = pgTable('profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').unique(),
  headline: text('headline'),
  company: text('company'),
  title: text('title'),
  bio: text('bio'),
  location: text('location'),
  // Why are you here? e.g. ["co-founder", "hiring", "learning AI"]
  intents: text('intents').array(),
  // What are you working on right now?
  currentFocus: text('current_focus'),
  interestedTopics: text('interested_topics').array(),
  notInterestedTopics: text('not_interested_topics').array(),
  // open | busy | dnd
  availability: text('availability').default('open'),
  socials: jsonb('socials').$type<Record<string, string>>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const project = pgTable(
  'project',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tagline: text('tagline'),
    description: text('description'),
    // startup | side-project | research | open-source | product
    category: text('category'),
    techStack: text('tech_stack').array(),
    // What the project is looking for: ["co-founder", "users", "feedback"]
    lookingFor: text('looking_for').array(),
    screenshots: text('screenshots').array(),
    links: jsonb('links').$type<Record<string, string>>(),
    trendingScore: integer('trending_score').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('project_owner_idx').on(t.ownerId)],
)

export const projectMember = pgTable(
  'project_member',
  {
    id: id(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('project_member_unique').on(t.projectId, t.userId)],
)

/* ------------------------------------------------------------------ */
/* Sessions (talks) — the OS for attending a talk                      */
/* ------------------------------------------------------------------ */

export const conferenceSession = pgTable(
  'conference_session',
  {
    id: id(),
    conferenceId: text('conference_id')
      .notNull()
      .references(() => conference.id, { onDelete: 'cascade' }),
    roomId: text('room_id').references(() => room.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    abstract: text('abstract'),
    track: text('track'),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    // Live transcript / AI summary populated during & after the talk.
    transcriptUrl: text('transcript_url'),
    aiSummary: text('ai_summary'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('conference_session_conference_idx').on(t.conferenceId),
    index('conference_session_starts_idx').on(t.startsAt),
  ],
)

export const sessionSpeaker = pgTable(
  'session_speaker',
  {
    id: id(),
    sessionId: text('session_id')
      .notNull()
      .references(() => conferenceSession.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('session_speaker_unique').on(t.sessionId, t.userId)],
)

/** One-tap bookmarked moment within a talk. */
export const moment = pgTable(
  'moment',
  {
    id: id(),
    sessionId: text('session_id')
      .notNull()
      .references(() => conferenceSession.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Offset into the talk, in milliseconds.
    timestampMs: integer('timestamp_ms').notNull(),
    transcriptSnippet: text('transcript_snippet'),
    slideRef: text('slide_ref'),
    note: text('note'),
    aiHighlight: boolean('ai_highlight').default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('moment_session_idx').on(t.sessionId),
    index('moment_user_idx').on(t.userId),
  ],
)

export const note = pgTable(
  'note',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => conferenceSession.id, {
      onDelete: 'cascade',
    }),
    // text | voice
    kind: text('kind').notNull().default('text'),
    body: text('body'),
    audioUrl: text('audio_url'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('note_user_idx').on(t.userId)],
)

/* ------------------------------------------------------------------ */
/* Questions → answers → discussions                                   */
/* ------------------------------------------------------------------ */

export const question = pgTable(
  'question',
  {
    id: id(),
    sessionId: text('session_id').references(() => conferenceSession.id, {
      onDelete: 'cascade',
    }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    // open | answered | archived
    status: text('status').notNull().default('open'),
    upvotes: integer('upvotes').default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('question_session_idx').on(t.sessionId)],
)

export const answer = pgTable(
  'answer',
  {
    id: id(),
    questionId: text('question_id')
      .notNull()
      .references(() => question.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    fromSpeaker: boolean('from_speaker').default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('answer_question_idx').on(t.questionId)],
)

/** A persistent discussion thread / topic channel. */
export const discussion = pgTable(
  'discussion',
  {
    id: id(),
    conferenceId: text('conference_id').references(() => conference.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    topic: text('topic'),
    // Optional links into the knowledge graph.
    sessionId: text('session_id').references(() => conferenceSession.id, {
      onDelete: 'set null',
    }),
    projectId: text('project_id').references(() => project.id, {
      onDelete: 'set null',
    }),
    questionId: text('question_id').references(() => question.id, {
      onDelete: 'set null',
    }),
    createdById: text('created_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('discussion_conference_idx').on(t.conferenceId)],
)

export const discussionPost = pgTable(
  'discussion_post',
  {
    id: id(),
    discussionId: text('discussion_id')
      .notNull()
      .references(() => discussion.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    body: text('body').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('discussion_post_discussion_idx').on(t.discussionId)],
)

/* ------------------------------------------------------------------ */
/* Messaging + connections (the network that remains)                  */
/* ------------------------------------------------------------------ */

export const message = pgTable(
  'message',
  {
    id: id(),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    readAt: timestamp('read_at'),
    createdAt: createdAt(),
  },
  (t) => [
    index('message_to_idx').on(t.toUserId),
    index('message_from_idx').on(t.fromUserId),
  ],
)

/** A directed connection between two attendees (the lasting network). */
export const connection = pgTable(
  'connection',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    contactId: text('contact_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // pending | accepted
    status: text('status').notNull().default('pending'),
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('connection_unique').on(t.userId, t.contactId)],
)

/** Personal MCP surface: lightweight tasks an agent can manage. */
export const task = pgTable(
  'task',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    done: boolean('done').default(false).notNull(),
    dueAt: timestamp('due_at'),
    createdAt: createdAt(),
  },
  (t) => [index('task_user_idx').on(t.userId)],
)
