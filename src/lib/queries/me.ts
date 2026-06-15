/**
 * Server functions for the signed-in user's own profile screen.
 *
 * The viewer is the authenticated better-auth user; these throw a 401 when
 * there is no session (the `/_app` layout redirects to `/login` first).
 */
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { profile, project, user } from '#/db/schema'
import { requireUserId } from '#/lib/server-auth'
import type { ProfileProject } from '#/lib/queries/profiles'

type ProfileRow = typeof profile.$inferSelect

export type MyProfile = {
  user: { id: string; name: string; email: string; image: string | null }
  profile: ProfileRow | null
  projects: Array<ProfileProject>
}

/** The viewer's account, extended profile and owned projects. */
export const getMyProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MyProfile | null> => {
    const userId = await requireUserId()

    const rows = await db
      .select({ user, profile })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const projects = await db
      .select({
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        category: project.category,
        trendingScore: project.trendingScore,
      })
      .from(project)
      .where(eq(project.ownerId, userId))

    return {
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        image: row.user.image,
      },
      profile: row.profile,
      projects: projects.sort((a, b) => b.trendingScore - a.trendingScore),
    }
  },
)

export type SaveMyProfileInput = {
  /** Account fields (better-auth `user` row). */
  name?: string
  /** New avatar url (from `/api/documents`) — omit to keep the current one. */
  image?: string | null
  /** Extended profile fields — upserted into the 1:1 `profile` row. */
  handle?: string | null
  headline?: string | null
  company?: string | null
  title?: string | null
  bio?: string | null
  location?: string | null
  currentFocus?: string | null
  intents?: Array<string>
  interestedTopics?: Array<string>
  notInterestedTopics?: Array<string>
  availability?: string
  socials?: Record<string, string>
}

const cleanText = (v: string | null | undefined) =>
  v === undefined ? undefined : v?.trim() || null

const cleanList = (v: Array<string> | undefined) =>
  v === undefined ? undefined : v.map((x) => x.trim()).filter(Boolean)

/** Persist the viewer's account + profile fields. Returns the fresh profile. */
export const saveMyProfile = createServerFn({ method: 'POST' })
  .validator((d: SaveMyProfileInput): SaveMyProfileInput => d)
  .handler(async ({ data }): Promise<MyProfile | null> => {
    const userId = await requireUserId()

    const name = data.name?.trim()
    const userUpdates = {
      ...(name ? { name } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    }
    if (Object.keys(userUpdates).length > 0) {
      await db.update(user).set(userUpdates).where(eq(user.id, userId))
    }

    const profileValues = {
      handle: cleanText(data.handle),
      headline: cleanText(data.headline),
      company: cleanText(data.company),
      title: cleanText(data.title),
      bio: cleanText(data.bio),
      location: cleanText(data.location),
      currentFocus: cleanText(data.currentFocus),
      intents: cleanList(data.intents),
      interestedTopics: cleanList(data.interestedTopics),
      notInterestedTopics: cleanList(data.notInterestedTopics),
      availability: data.availability,
      socials: data.socials,
    }
    const updates = Object.fromEntries(
      Object.entries(profileValues).filter(([, v]) => v !== undefined),
    )

    if (Object.keys(updates).length > 0) {
      await db
        .insert(profile)
        .values({ userId, ...updates })
        .onConflictDoUpdate({
          target: profile.userId,
          set: { ...updates, updatedAt: new Date() },
        })
    }

    return getMyProfile()
  })
