import { eq, sql } from 'drizzle-orm'

import { db } from '#/db'
import { discussion, project, projectMember } from '#/db/schema'

/**
 * Derive a project's trending score from the signals we actually track: how
 * much conversation it has drawn (discussions linked to it) and the size of its
 * team. `trendingScore` was previously a hand-set integer that only the seed
 * ever wrote — this makes it a function of real activity, recomputed on write.
 *
 * (Page views / bookmarks aren't modelled yet; when they are, fold them in here
 * and the rest of the app picks it up for free.)
 */
const DISCUSSION_WEIGHT = 10
const MEMBER_WEIGHT = 3

export async function recomputeTrendingScore(
  projectId: string,
): Promise<number> {
  const [{ discussions }] = await db
    .select({ discussions: sql<number>`count(*)::int` })
    .from(discussion)
    .where(eq(discussion.projectId, projectId))

  const [{ members }] = await db
    .select({ members: sql<number>`count(*)::int` })
    .from(projectMember)
    .where(eq(projectMember.projectId, projectId))

  const score = discussions * DISCUSSION_WEIGHT + members * MEMBER_WEIGHT
  await db
    .update(project)
    .set({ trendingScore: score })
    .where(eq(project.id, projectId))
  return score
}

/** Recompute every project's score (e.g. a scheduled refresh). */
export async function recomputeAllTrendingScores(): Promise<void> {
  const rows = await db.select({ id: project.id }).from(project)
  await Promise.all(rows.map((r) => recomputeTrendingScore(r.id)))
}
