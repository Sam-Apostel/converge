import type {
  conference,
  conferenceSession,
  discussion,
  message,
  moment,
  profile,
  project,
  question,
  task,
} from './schema'

/** Row types inferred from the drizzle schema (type-only — safe on the client). */
export type Conference = typeof conference.$inferSelect
export type ConferenceSession = typeof conferenceSession.$inferSelect
export type Profile = typeof profile.$inferSelect
export type Project = typeof project.$inferSelect
export type Moment = typeof moment.$inferSelect
export type Question = typeof question.$inferSelect
export type Discussion = typeof discussion.$inferSelect
export type Message = typeof message.$inferSelect
export type Task = typeof task.$inferSelect

/** A person card combines the better-auth user with their Converge profile. */
export type Person = {
  id: string
  name: string
  image: string | null
  profile: Profile | null
}
