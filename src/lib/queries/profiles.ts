import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import {
  conferenceSession,
  connection,
  profile,
  project,
  projectMember,
  sessionSpeaker,
  user,
} from '#/db/schema'
import type { Person } from '#/db/types'
import { resolveViewer } from '#/lib/queries/messages'

/** Where the viewer stands with this person: not yet, requested, or connected. */
export type ConnectionState = 'none' | 'pending' | 'accepted'

/** A person's project as shown in the profile rows / project header. */
export type ProfileProject = {
  id: string
  slug: string
  name: string
  tagline: string | null
  category: string | null
  trendingScore: number
}

export type PersonDetail = {
  person: Person
  projects: Array<ProfileProject>
  /** The viewer's connection state with this person — drives the Connect button. */
  connectionState: ConnectionState
}

/** A full person profile: the user, their profile, and the projects they own/join. */
export const getPersonById = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<PersonDetail | null> => {
    const rows = await db
      .select({ user, profile })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const person: Person = {
      id: row.user.id,
      name: row.user.name,
      image: row.user.image,
      profile: row.profile,
    }

    // The viewer's standing with this person (none → pending → accepted).
    const me = await resolveViewer()
    let connectionState: ConnectionState = 'none'
    if (me !== userId) {
      const [link] = await db
        .select({ status: connection.status })
        .from(connection)
        .where(
          and(eq(connection.userId, me), eq(connection.contactId, userId)),
        )
        .limit(1)
      if (link?.status === 'accepted') connectionState = 'accepted'
      else if (link) connectionState = 'pending'
    }

    const cols = {
      id: project.id,
      slug: project.slug,
      name: project.name,
      tagline: project.tagline,
      category: project.category,
      trendingScore: project.trendingScore,
    }

    // Projects this person owns, plus any they're a member of (deduped by id).
    const [owned, joined] = await Promise.all([
      db.select(cols).from(project).where(eq(project.ownerId, userId)),
      db
        .select(cols)
        .from(project)
        .innerJoin(projectMember, eq(projectMember.projectId, project.id))
        .where(eq(projectMember.userId, userId)),
    ])

    const byId = new Map<string, ProfileProject>()
    for (const p of [...owned, ...joined]) byId.set(p.id, p)
    const projects = [...byId.values()].sort(
      (a, b) => b.trendingScore - a.trendingScore,
    )

    return { person, projects, connectionState }
  })

/** A project member, surfaced in the "looking for" avatar stack. */
export type ProjectMemberRow = {
  id: string
  name: string
  image: string | null
  role: string | null
}

export type ProjectDetail = {
  project: typeof project.$inferSelect
  ownerName: string | null
  members: Array<ProjectMemberRow>
  relatedTalk: { title: string; startsAt: Date | null } | null
}

/** A full project profile: the project, its owner, members, and a related talk. */
export const getProjectBySlug = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<ProjectDetail | null> => {
    const rows = await db
      .select({ project, ownerName: user.name })
      .from(project)
      .leftJoin(user, eq(user.id, project.ownerId))
      .where(eq(project.slug, slug))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const members = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        role: projectMember.role,
      })
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, row.project.id))

    // The owner's talk, if they're speaking — surfaced as "Related talk · …".
    const talks = await db
      .select({
        title: conferenceSession.title,
        startsAt: conferenceSession.startsAt,
      })
      .from(conferenceSession)
      .innerJoin(
        sessionSpeaker,
        eq(sessionSpeaker.sessionId, conferenceSession.id),
      )
      .where(eq(sessionSpeaker.userId, row.project.ownerId))
      .orderBy(asc(conferenceSession.startsAt))
      .limit(1)

    return {
      project: row.project,
      ownerName: row.ownerName,
      members,
      relatedTalk: talks[0] ?? null,
    }
  })
