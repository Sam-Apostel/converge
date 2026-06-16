/**
 * Seed Converge with real data scraped from the "Progress x GitNation"
 * hackathon (HackathonParty #43 — React Summit / JSNation, Amsterdam, 2026).
 *
 * Unlike `seed.ts`, this script is *additive and idempotent*: it never
 * truncates. People, the conference, and projects are upserted by their natural
 * keys (email / slug), so it can run on its own or layered on top of the mock
 * seed. Run with:
 *
 *   bun run db:seed:hackathon
 *
 * The scraped data lives in `src/scripts/data/hackathon-43.ts`; refresh it by
 * re-running the Python scraper + processor in `src/scripts/data/`.
 */
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { user } from '#/db/auth-schema'
import {
  conference,
  conferenceMember,
  profile,
  project,
  projectMember,
} from '#/db/domain-schema'

import {
  hackathon,
  type HackathonPerson,
  people,
  projects,
} from './data/hackathon-43'

const uid = () => crypto.randomUUID()

const avatar = (key: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(key)}`

/** A readable label for a scraped team role. */
const roleLabel = (role: string) =>
  role === 'engineer'
    ? 'Engineer'
    : role === 'ux'
      ? 'Designer'
      : role === 'product'
        ? 'Product'
        : 'Builder'

/** Upsert a conference by slug, returning its id. */
async function upsertConference(): Promise<string> {
  const existing = await db
    .select({ id: conference.id })
    .from(conference)
    .where(eq(conference.slug, hackathon.slug))
  if (existing[0]) return existing[0].id

  const id = uid()
  await db.insert(conference).values({
    id,
    slug: hackathon.slug,
    name: hackathon.name,
    tagline: hackathon.tagline,
    description: hackathon.description,
    timezone: hackathon.timezone,
    startsAt: new Date(hackathon.startsAt),
    endsAt: new Date(hackathon.endsAt),
    venueName: hackathon.venueName,
  })
  return id
}

/** Upsert a better-auth user by email, returning its id. */
async function upsertUser(p: HackathonPerson): Promise<string> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, p.email))
  if (existing[0]) return existing[0].id

  const id = uid()
  await db.insert(user).values({
    id,
    name: p.name,
    email: p.email,
    emailVerified: true,
    image: p.image ?? avatar(p.handle),
  })
  return id
}

/**
 * Seed the hackathon conference, its people and projects. Additive and
 * idempotent — safe to call standalone or from the main `seed.ts` after its
 * own inserts (their natural keys don't overlap, so nothing is clobbered).
 */
export async function seedHackathon() {
  console.log('🌱 Seeding Converge from Progress x GitNation hackathon…')

  const conferenceId = await upsertConference()
  console.log(`  ✓ conference ${hackathon.name}`)

  // Each person's "home" project — the first project they appear on — drives
  // their derived headline, focus and interests.
  const homeProject = new Map<string, (typeof projects)[number]>()
  for (const pr of projects) {
    for (const m of pr.members) {
      if (!homeProject.has(m.key)) homeProject.set(m.key, pr)
    }
  }

  /* --- people: users + profiles + conference membership --- */
  const userIds = new Map<string, string>()
  for (const p of people) {
    const id = await upsertUser(p)
    userIds.set(p.key, id)

    const home = homeProject.get(p.key)
    const topics = (home?.techStack ?? [])
      .map((t) => t.toLowerCase())
      .slice(0, 4)

    await db
      .insert(profile)
      .values({
        userId: id,
        handle: p.handle,
        headline: home
          ? `${roleLabel(p.role)} — built ${home.name} at ${hackathon.name}`
          : `${roleLabel(p.role)} at ${hackathon.name}`,
        bio: home
          ? `Built ${home.name} (${home.tagline}) at the ${hackathon.name} hackathon — React Summit / JSNation, Amsterdam.`
          : `Hacked at the ${hackathon.name} hackathon — React Summit / JSNation, Amsterdam.`,
        location: 'Amsterdam, NL',
        intents: ['hackathon', 'collaboration', 'meet people'],
        currentFocus: home?.tagline ?? null,
        interestedTopics: ['hackathon', ...topics],
        availability: 'open',
        socials: {},
      })
      .onConflictDoNothing()

    await db
      .insert(conferenceMember)
      .values({ conferenceId, userId: id, role: 'attendee' })
      .onConflictDoNothing()
  }
  console.log(`  ✓ ${people.length} people`)

  /* --- projects + members --- */
  let projectCount = 0
  for (const pr of projects) {
    const ownerKey = pr.owner ?? pr.members[0]?.key
    if (!ownerKey || !userIds.has(ownerKey)) continue
    const ownerId = userIds.get(ownerKey)!

    const existing = await db
      .select({ id: project.id })
      .from(project)
      .where(eq(project.slug, pr.slug))

    let projectId: string
    if (existing[0]) {
      projectId = existing[0].id
    } else {
      projectId = uid()
      await db.insert(project).values({
        id: projectId,
        slug: pr.slug,
        ownerId,
        name: pr.name,
        tagline: pr.tagline,
        description: pr.description,
        category: 'side-project',
        techStack: pr.techStack,
        lookingFor: pr.winner
          ? ['feedback', 'users']
          : ['feedback', 'collaborators'],
        screenshots: pr.image ? [pr.image] : [],
        links: pr.links,
        trendingScore: pr.trendingScore,
      })
      projectCount++
    }

    await db
      .insert(projectMember)
      .values({ projectId, userId: ownerId, role: 'owner' })
      .onConflictDoNothing()
    for (const m of pr.members) {
      const memberId = userIds.get(m.key)
      if (!memberId || memberId === ownerId) continue
      await db
        .insert(projectMember)
        .values({ projectId, userId: memberId, role: m.role })
        .onConflictDoNothing()
    }
  }
  console.log(`  ✓ ${projectCount} new projects (${projects.length} total)`)

  console.log('✅ Seed complete.')
}

// Run standalone via `bun run db:seed:hackathon`. When imported by `seed.ts`
// this block is skipped so the connection stays open for the caller.
if (import.meta.main) {
  seedHackathon()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Hackathon seed failed:', err)
      process.exit(1)
    })
}
