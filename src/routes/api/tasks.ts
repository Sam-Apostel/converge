import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { task } from '#/db/schema'
import { requireUser } from '#/lib/server-auth'

/** Personal tasks — part of the "Personal MCP" surface. Scoped to the user. */
export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireUser(request)
        const rows = await db
          .select()
          .from(task)
          .where(eq(task.userId, user.id))
          .orderBy(desc(task.createdAt))
        return Response.json(rows)
      },
      POST: async ({ request }) => {
        const user = await requireUser(request)
        const body = (await request.json()) as { title: string }
        const [row] = await db
          .insert(task)
          .values({ userId: user.id, title: body.title })
          .returning()
        return Response.json(row, { status: 201 })
      },
    },
  },
})
