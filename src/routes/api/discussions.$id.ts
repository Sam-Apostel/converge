import { createFileRoute } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { discussion, discussionPost, user } from '#/db/schema'

/** A single discussion thread with its posts (oldest first), author hydrated. */
export const Route = createFileRoute('/api/discussions/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [thread] = await db
          .select({
            id: discussion.id,
            title: discussion.title,
            topic: discussion.topic,
            sessionId: discussion.sessionId,
            projectId: discussion.projectId,
            questionId: discussion.questionId,
            createdAt: discussion.createdAt,
            updatedAt: discussion.updatedAt,
            authorName: user.name,
          })
          .from(discussion)
          .leftJoin(user, eq(user.id, discussion.createdById))
          .where(eq(discussion.id, params.id))
          .limit(1)
        if (!thread) return new Response('Not found', { status: 404 })

        const postRows = await db
          .select({
            id: discussionPost.id,
            discussionId: discussionPost.discussionId,
            authorId: discussionPost.authorId,
            parentId: discussionPost.parentId,
            body: discussionPost.body,
            createdAt: discussionPost.createdAt,
            authorName: user.name,
            authorImage: user.image,
          })
          .from(discussionPost)
          .innerJoin(user, eq(user.id, discussionPost.authorId))
          .where(eq(discussionPost.discussionId, params.id))
          .orderBy(asc(discussionPost.createdAt))

        return Response.json({
          ...thread,
          posts: postRows.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          })),
        })
      },
    },
  },
})
