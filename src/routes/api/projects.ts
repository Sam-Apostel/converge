import { createFileRoute } from '@tanstack/react-router'
import { and, desc, eq, like } from 'drizzle-orm'

import { db } from '#/db'
import { project } from '#/db/schema'
import { recomputeTrendingScore } from '#/lib/queries/trending'
import { requireUser } from '#/lib/server-auth'

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** A unique slug for `name` — appends `-2`, `-3`, … when the base is taken. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'project'
  const taken = new Set(
    (
      await db
        .select({ slug: project.slug })
        .from(project)
        .where(like(project.slug, `${base}%`))
    ).map((r) => r.slug),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
  }
}

/**
 * Projects API — backs the projects list and the registration flow.
 * GET lists the trending projects; POST registers one for the signed-in user.
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
          name?: string
          tagline?: string
          description?: string
          category?: string
          techStack?: Array<string>
          lookingFor?: Array<string>
          links?: Record<string, string>
          screenshots?: Array<string>
        }

        const name = body.name?.trim()
        if (!name) {
          return new Response('Project name is required', { status: 400 })
        }

        const clean = (list: Array<string> | undefined) =>
          list?.map((s) => s.trim()).filter(Boolean)

        const [row] = await db
          .insert(project)
          .values({
            ownerId: user.id,
            name,
            slug: await uniqueSlug(name),
            tagline: body.tagline?.trim() || null,
            description: body.description?.trim() || null,
            category: body.category || null,
            techStack: clean(body.techStack),
            lookingFor: clean(body.lookingFor),
            links: body.links,
            screenshots: clean(body.screenshots),
          })
          .returning()

        await recomputeTrendingScore(row.id)

        return Response.json(row, { status: 201 })
      },
      PATCH: async ({ request }) => {
        const user = await requireUser(request)
        const body = (await request.json()) as {
          id?: string
          name?: string
          tagline?: string
          description?: string
          category?: string
          techStack?: Array<string>
          lookingFor?: Array<string>
          links?: Record<string, string>
          screenshots?: Array<string>
        }

        if (!body.id) return new Response('Project id is required', { status: 400 })
        const name = body.name?.trim()
        if (!name) return new Response('Project name is required', { status: 400 })

        // Ownership check — only the owner may edit.
        const [existing] = await db
          .select({ id: project.id, ownerId: project.ownerId })
          .from(project)
          .where(eq(project.id, body.id))
          .limit(1)
        if (!existing) return new Response('Project not found', { status: 404 })
        if (existing.ownerId !== user.id)
          return new Response('Not your project', { status: 403 })

        const clean = (list: Array<string> | undefined) =>
          list?.map((s) => s.trim()).filter(Boolean)

        const [row] = await db
          .update(project)
          .set({
            name,
            tagline: body.tagline?.trim() || null,
            description: body.description?.trim() || null,
            category: body.category || null,
            techStack: clean(body.techStack),
            lookingFor: clean(body.lookingFor),
            links: body.links,
            screenshots: clean(body.screenshots),
            updatedAt: new Date(),
          })
          .where(and(eq(project.id, body.id), eq(project.ownerId, user.id)))
          .returning()

        return Response.json(row)
      },
    },
  },
})
