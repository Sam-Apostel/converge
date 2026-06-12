import { createServerFn } from '@tanstack/react-start'
import { ilike, or, sql } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  discussion,
  profile,
  project,
  user,
} from '#/db/schema'

/**
 * Global search — one `ILIKE '%q%'` sweep across people, projects, sessions and
 * discussions (v1; Postgres full-text/`tsvector` is a fine later upgrade).
 *
 * Returns a typed, ranked union capped per type. Exposed as a server fn for the
 * page loader (SSR) and re-used by the `/api/search` route for type-as-you-go.
 */

export type SearchResultType = 'person' | 'project' | 'session' | 'discussion'

export type SearchResult = {
  type: SearchResultType
  /** Route param for the detail link (userId / slug / sessionId / discussion id). */
  id: string
  title: string
  subtitle: string | null
  href: string
}

/** Per-type cap so one entity can't drown the others. */
const PER_TYPE = 6

/** Escape LIKE wildcards so a literal `%`/`_`/`\` in the query stays literal. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`
}

/** Rank: title hits sort above secondary-field hits, stable within a tier. */
function byTitleMatch(q: string) {
  const needle = q.toLowerCase()
  return (a: SearchResult, b: SearchResult) => {
    const am = a.title.toLowerCase().includes(needle) ? 0 : 1
    const bm = b.title.toLowerCase().includes(needle) ? 0 : 1
    return am - bm
  }
}

export const searchAll = createServerFn({ method: 'GET' })
  .validator((q: string) => q)
  .handler(async ({ data: rawQuery }): Promise<SearchResult[]> => {
    const q = rawQuery.trim()
    if (!q) return []

    const pat = likePattern(q)
    const sort = byTitleMatch(q)

    const [people, projects, sessions, discussions] = await Promise.all([
      // People — name + headline + company + their topics/intents.
      db
        .select({
          id: user.id,
          name: user.name,
          headline: profile.headline,
          company: profile.company,
        })
        .from(user)
        .leftJoin(profile, sql`${profile.userId} = ${user.id}`)
        .where(
          or(
            ilike(user.name, pat),
            ilike(profile.headline, pat),
            ilike(profile.company, pat),
            sql`array_to_string(${profile.interestedTopics}, ' ') ilike ${pat}`,
            sql`array_to_string(${profile.intents}, ' ') ilike ${pat}`,
          ),
        )
        .limit(PER_TYPE),

      // Projects — name + tagline + category + tech stack.
      db
        .select({
          slug: project.slug,
          name: project.name,
          tagline: project.tagline,
          category: project.category,
        })
        .from(project)
        .where(
          or(
            ilike(project.name, pat),
            ilike(project.tagline, pat),
            ilike(project.category, pat),
            sql`array_to_string(${project.techStack}, ' ') ilike ${pat}`,
          ),
        )
        .limit(PER_TYPE),

      // Sessions — title + abstract + track.
      db
        .select({
          id: conferenceSession.id,
          slug: conferenceSession.slug,
          title: conferenceSession.title,
          track: conferenceSession.track,
        })
        .from(conferenceSession)
        .where(
          or(
            ilike(conferenceSession.title, pat),
            ilike(conferenceSession.abstract, pat),
            ilike(conferenceSession.track, pat),
          ),
        )
        .limit(PER_TYPE),

      // Discussions — title + topic.
      db
        .select({
          id: discussion.id,
          title: discussion.title,
          topic: discussion.topic,
        })
        .from(discussion)
        .where(or(ilike(discussion.title, pat), ilike(discussion.topic, pat)))
        .limit(PER_TYPE),
    ])

    const peopleResults: SearchResult[] = people.map((p) => ({
      type: 'person',
      id: p.id,
      title: p.name,
      subtitle: p.headline ?? p.company,
      href: `/people/${p.id}`,
    }))

    const projectResults: SearchResult[] = projects.map((p) => ({
      type: 'project',
      id: p.slug,
      title: p.name,
      subtitle: p.tagline ?? p.category,
      href: `/projects/${p.slug}`,
    }))

    const sessionResults: SearchResult[] = sessions.map((s) => ({
      type: 'session',
      id: s.slug,
      title: s.title,
      subtitle: s.track,
      href: `/sessions/${s.slug}`,
    }))

    const discussionResults: SearchResult[] = discussions.map((d) => ({
      type: 'discussion',
      id: d.id,
      title: d.title,
      subtitle: d.topic,
      href: `/discussions/${d.id}`,
    }))

    return [
      ...peopleResults.sort(sort),
      ...projectResults.sort(sort),
      ...sessionResults.sort(sort),
      ...discussionResults.sort(sort),
    ]
  })
