import { createFileRoute } from '@tanstack/react-router'
import { desc } from 'drizzle-orm'

import { db } from '#/db'
import { project } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/**
 * Projects API — backs the `projectsCollection` TanStack DB collection.
 * GET lists the trending projects; POST creates one for the signed-in user.
 */
export const Route = createFileRoute('/api/projects')({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db
          .select()
          .from(project)
          .orderBy(desc(project.trendingScore), desc(project.createdAt))
          .limit(100)
        return Response.json(rows)
      },
      POST: async ({ request }) => {
        const user = await requireUser(request)
        const body = (await request.json()) as {
          name: string
          slug?: string
          tagline?: string
          description?: string
          category?: string
          techStack?: Array<string>
          lookingFor?: Array<string>
        }

        const slug =
          body.slug ??
          body.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        const [row] = await db
          .insert(project)
          .values({
            ownerId: user.id,
            name: body.name,
            slug,
            tagline: body.tagline,
            description: body.description,
            category: body.category,
            techStack: body.techStack,
            lookingFor: body.lookingFor,
          })
          .returning()

        return Response.json(row, { status: 201 })
      },
    },
  },
})
