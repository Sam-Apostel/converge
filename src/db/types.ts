import type {
  conferenceSession,
  moment,
  profile,
  project,
  question,
} from './schema'

/** Row types inferred from the drizzle schema (type-only — safe on the client). */
export type ConferenceSession = typeof conferenceSession.$inferSelect
type Profile = typeof profile.$inferSelect
export type Project = typeof project.$inferSelect
export type Moment = typeof moment.$inferSelect
export type Question = typeof question.$inferSelect

/** A person card combines the better-auth user with their Converge profile. */
export type Person = {
  id: string
  name: string
  image: string | null
  profile: Profile | null
}
