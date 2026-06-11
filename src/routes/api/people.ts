import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { profile, user } from '#/db/schema'
import type { Person } from '#/db/types'

/** People directory — joins better-auth users with their Converge profile. */
export const Route = createFileRoute('/api/people')({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db
          .select({ user, profile })
          .from(user)
          .leftJoin(profile, eq(profile.userId, user.id))
          .limit(200)

        const people: Array<Person> = rows.map((r) => ({
          id: r.user.id,
          name: r.user.name,
          image: r.user.image,
          profile: r.profile,
        }))

        return Response.json(people)
      },
    },
  },
})
