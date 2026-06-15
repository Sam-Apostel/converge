import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { profile, user } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * The signed-in user's editable profile.
 *
 * - `GET`   → `{ id, name, email, image, profile }` for the viewer.
 * - `PATCH` → upsert the profile (and the user's name/image). The client sends
 *   the whole form, so provided fields fully replace the stored ones.
 *
 * The acting user always comes from the session — never the request body.
 */
export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await requireUser(request)
        const [row] = await db
          .select()
          .from(profile)
          .where(eq(profile.userId, me.id))
          .limit(1)
        return Response.json({
          id: me.id,
          name: me.name,
          email: me.email,
          image: me.image,
          profile: row ?? null,
        })
      },

      PATCH: async ({ request }) => {
        const me = await requireUser(request)
        const body = (await request.json()) as {
          name?: string
          image?: string | null
          handle?: string | null
          headline?: string | null
          company?: string | null
          title?: string | null
          bio?: string | null
          location?: string | null
          intents?: Array<string> | null
          currentFocus?: string | null
          interestedTopics?: Array<string> | null
          notInterestedTopics?: Array<string> | null
          availability?: string | null
          socials?: Record<string, string> | null
        }

        const userPatch: Partial<typeof user.$inferInsert> = {}
        if (body.name?.trim()) userPatch.name = body.name.trim()
        if (body.image !== undefined) userPatch.image = body.image
        if (Object.keys(userPatch).length) {
          await db.update(user).set(userPatch).where(eq(user.id, me.id))
        }

        const values = {
          handle: body.handle ?? null,
          headline: body.headline ?? null,
          company: body.company ?? null,
          title: body.title ?? null,
          bio: body.bio ?? null,
          location: body.location ?? null,
          intents: body.intents ?? null,
          currentFocus: body.currentFocus ?? null,
          interestedTopics: body.interestedTopics ?? null,
          notInterestedTopics: body.notInterestedTopics ?? null,
          availability: body.availability ?? 'open',
          socials: body.socials ?? null,
        }

        await db
          .insert(profile)
          .values({ userId: me.id, ...values })
          .onConflictDoUpdate({
            target: profile.userId,
            set: { ...values, updatedAt: new Date() },
          })

        const [row] = await db
          .select()
          .from(profile)
          .where(eq(profile.userId, me.id))
          .limit(1)

        return Response.json({
          id: me.id,
          name: userPatch.name ?? me.name,
          email: me.email,
          image: body.image !== undefined ? body.image : me.image,
          profile: row ?? null,
        })
      },
    },
  },
})
