import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { profile, project, projectMember, user } from '#/db/schema'

/** A single project by slug, with its owner and team members (people). */
export const Route = createFileRoute('/api/projects/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [row] = await db
          .select()
          .from(project)
          .where(eq(project.slug, params.slug))
          .limit(1)
        if (!row) return new Response('Not found', { status: 404 })

        const [ownerRow] = await db
          .select({ id: user.id, name: user.name, image: user.image, headline: profile.headline })
          .from(user)
          .leftJoin(profile, eq(profile.userId, user.id))
          .where(eq(user.id, row.ownerId))
          .limit(1)

        const members = await db
          .select({
            id: user.id,
            name: user.name,
            image: user.image,
            headline: profile.headline,
            role: projectMember.role,
          })
          .from(projectMember)
          .innerJoin(user, eq(user.id, projectMember.userId))
          .leftJoin(profile, eq(profile.userId, user.id))
          .where(eq(projectMember.projectId, row.id))

        return Response.json({ ...row, owner: ownerRow ?? null, members })
      },
    },
  },
})
