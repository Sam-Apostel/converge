/**
 * Seed Converge with React Summit 2026 demo content (the same world as the
 * design mock). Idempotent: wipes the domain tables + demo users, then inserts.
 *
 *   bun run db:seed
 */
import 'dotenv/config'
import { sql } from 'drizzle-orm'

import { db } from '#/db'
import {
  answer,
  conference,
  conferenceSession,
  discussion,
  discussionPost,
  moment,
  note,
  profile,
  project,
  projectMember,
  question,
  room,
  sessionSpeaker,
  user,
} from '#/db/schema'

const CONF_DAY = '2026-06-11'
const at = (hhmm: string) => new Date(`${CONF_DAY}T${hhmm}:00+02:00`)

type Person = {
  handle: string
  name: string
  title: string
  company: string
  intent: string
  topics: Array<string>
  location: string
  bio?: string
  focus?: string
  dislikes?: Array<string>
  socials?: Record<string, string>
}

const PEOPLE: Array<Person> = [
  {
    handle: 'aurora',
    name: 'Aurora Scharff',
    title: 'DX Engineer',
    company: 'Vercel',
    intent: 'Meeting RSC builders',
    topics: ['RSC', 'Next.js', 'DX'],
    location: 'Summit Stage',
    bio: 'Here to meet people pushing React Server Components into production and compare notes on streaming + caching.',
    focus:
      'Making RSCs approachable — docs, DX, and the mental models teams actually need to ship.',
    dislikes: ['Recruiting', 'Crypto'],
    socials: { github: 'aurorascharff', x: 'aurorascharff', website: 'https://aurora.dev' },
  },
  {
    handle: 'kitze',
    name: 'Kitze',
    title: 'Founder',
    company: 'React Academy',
    intent: 'Looking for co-founders',
    topics: ['AI', 'DX', 'Teaching', 'RSC'],
    location: 'Hall B',
    bio: 'Looking for a technical co-founder for an AI tool for educators. Also here to meet makers shipping weird, delightful things.',
    focus:
      'Building React Academy Live — cohort-based courses with an AI pair-teacher that watches your editor and nudges in real time.',
    dislikes: ['Recruiting', 'Sales', 'Crypto'],
    socials: { github: 'kitze', x: 'thekitze', website: 'https://sizzy.co' },
  },
  {
    handle: 'mark',
    name: 'Mark Erikson',
    title: 'Engineer',
    company: 'Replay.io',
    intent: 'Learning AI tooling',
    topics: ['Compiler', 'Redux', 'Debug'],
    location: 'Q&A Room 2',
    bio: 'Redux maintainer. Here to learn how teams are folding AI into their everyday debugging and review loops.',
    focus: 'Time-travel debugging at Replay and the long tail of React state questions.',
    dislikes: ['Crypto'],
    socials: { github: 'markerikson', x: 'acemarke', website: 'https://blog.isquaredsoftware.com' },
  },
  {
    handle: 'kadi',
    name: 'Kadi Kraman',
    title: 'Eng Lead',
    company: 'Expo',
    intent: 'Meeting makers',
    topics: ['React Native', 'Mobile'],
    location: 'Base Camp',
    bio: 'Mobile-first. Want to meet people building delightful native experiences with React.',
    focus: 'Expo Router and making React Native feel effortless.',
    dislikes: ['Sales'],
  },
  {
    handle: 'faris',
    name: 'Faris Aziz',
    title: 'Staff Engineer',
    company: 'Smallpdf',
    intent: 'Open to work',
    topics: ['Resilience', 'Production'],
    location: 'Hall A',
    bio: 'Open to work. Strong on production resilience, error boundaries and the boring parts that keep apps alive.',
    focus: 'Streaming UIs that degrade gracefully when the server hiccups.',
  },
  {
    handle: 'scott',
    name: 'Scott Tolinski',
    title: 'Educator',
    company: 'Syntax.fm',
    intent: 'Hiring teachers',
    topics: ['CSS', 'DX', 'Video'],
    location: 'Mezzanine',
    bio: 'Syntax co-host. Hiring people who love to teach the web.',
    focus: 'Level Up Tutorials and making CSS feel fun again.',
    socials: { x: 'stolinski', website: 'https://syntax.fm' },
  },
  {
    handle: 'ryan',
    name: 'Ryan Skinner',
    title: 'Systems Engineer',
    company: 'Independent',
    intent: 'Early adopters & contributors',
    topics: ['Rust', 'RSC', 'Performance'],
    location: 'Hall A',
    bio: 'Building rari — an RSC framework on a Rust runtime. Looking for early adopters.',
    focus: 'Native RSC payload serialization and squeezing throughput out of the server.',
  },
  {
    handle: 'erik',
    name: 'Erik Rasmussen',
    title: 'Framework Author',
    company: 'Independent',
    intent: 'Contributors',
    topics: ['TypeScript', 'Signals', 'UI'],
    location: 'Hall B',
    bio: 'Author of Ripple. Distilling the good parts of React, Svelte and Solid into one runtime.',
    focus: 'A TypeScript-first reactive UI runtime.',
  },
  {
    handle: 'mike',
    name: 'Mike Grabowski',
    title: 'Founder',
    company: 'Callstack',
    intent: 'Design partners',
    topics: ['AI', 'Mobile', 'Agents'],
    location: 'Mezzanine',
    bio: 'Building Agent Hands — giving AI agents real hands on a device. Looking for design partners.',
    focus: 'Agents that tap, scroll and verify like a human on real devices.',
  },
  {
    handle: 'younes',
    name: 'Younes Jaaidi',
    title: 'Test Engineer',
    company: 'Marmicode',
    intent: 'Beta testers',
    topics: ['Testing', 'E2E', 'AI'],
    location: 'Hall A',
    bio: 'Building Testronaut — agent-assisted E2E tests that read like product specs.',
    focus: 'Tests that describe behaviour, not selectors.',
  },
  {
    handle: 'mikkel',
    name: 'Mikkel Malmberg',
    title: 'Maker',
    company: 'Independent',
    intent: 'Contributors',
    topics: ['Local-first', 'P2P'],
    location: 'Base Camp',
    bio: 'Building Keet — peer-to-peer, local-first messaging with no servers in the middle.',
    focus: 'Local-first apps that work with no backend at all.',
  },
]

type Proj = {
  slug: string
  name: string
  owner: string
  category: string
  tagline: string
  description: string
  stack: Array<string>
  seeks: string
  stars: number
}

const PROJECTS: Array<Proj> = [
  {
    slug: 'ripple',
    name: 'Ripple',
    owner: 'erik',
    category: 'UI Framework',
    tagline: 'The good parts of React, Svelte and Solid in one TypeScript-first runtime.',
    description:
      'A reactive UI runtime that takes the ergonomics people love from React, Svelte and Solid and unifies them — signals, fine-grained updates, and a compiler that disappears at build time.',
    stack: ['TypeScript', 'Signals', 'Compiler', 'Vite'],
    seeks: 'Contributors',
    stars: 1200,
  },
  {
    slug: 'rari',
    name: 'rari',
    owner: 'ryan',
    category: 'RSC · Rust',
    tagline: 'A React Server Components framework on a Rust runtime. ~45× the throughput.',
    description:
      'A React Server Components framework running on a Rust runtime. Streams HTML and serializes the RSC payload natively — roughly 45× the throughput of the Node reference server.',
    stack: ['Rust', 'React 19', 'RSC payload', 'Vite'],
    seeks: 'Early adopters',
    stars: 860,
  },
  {
    slug: 'agent-hands',
    name: 'Agent Hands',
    owner: 'mike',
    category: 'AI · Mobile',
    tagline: 'Give AI agents real hands on a device — tap, scroll and verify like a human.',
    description:
      'A runtime that gives AI agents real hands on a device: tap, scroll, type and verify exactly like a human tester, with a feedback loop that catches when the UI lies.',
    stack: ['AI', 'Appium', 'React Native', 'TypeScript'],
    seeks: 'Design partner',
    stars: 690,
  },
  {
    slug: 'testronaut',
    name: 'Testronaut',
    owner: 'younes',
    category: 'Testing',
    tagline: 'Agent-assisted end-to-end tests that read like product specs, not selectors.',
    description:
      'Write end-to-end tests as plain product specs and let an agent drive the browser. The tests read like acceptance criteria and survive refactors that break selector-based suites.',
    stack: ['Playwright', 'AI', 'TypeScript'],
    seeks: 'Beta testers',
    stars: 430,
  },
  {
    slug: 'keet',
    name: 'Keet',
    owner: 'mikkel',
    category: 'Local-first',
    tagline: 'Peer-to-peer, local-first messaging with no servers in the middle at all.',
    description:
      'Fully peer-to-peer, local-first messaging. Your data lives on your devices and syncs directly with your peers — there is no server in the middle to trust, breach or shut down.',
    stack: ['Hypercore', 'P2P', 'Bare'],
    seeks: 'Contributors',
    stars: 540,
  },
  {
    slug: 'sizzy',
    name: 'Sizzy',
    owner: 'kitze',
    category: 'Dev Tools',
    tagline: 'The browser built for developers — every viewport, synced, side by side.',
    description:
      'A browser built for developers: preview every viewport at once, keep them scroll- and interaction-synced, and inspect responsive layouts without resizing a single window.',
    stack: ['Electron', 'React', 'TypeScript'],
    seeks: 'Beta testers',
    stars: 910,
  },
]

type Talk = {
  title: string
  speaker: string
  room: string
  start: string
  end: string
  track: string
  abstract: string
}

const TALKS: Array<Talk> = [
  {
    title: 'What RSCs Can Do in Next.js Today',
    speaker: 'aurora',
    room: 'Summit Stage',
    start: '09:30',
    end: '09:55',
    track: 'Frameworks',
    abstract:
      'A tour of what React Server Components actually unlock in Next.js right now — server-first by default, mutations without ceremony, and where this is all going.',
  },
  {
    title: 'Debugging the Undebuggable',
    speaker: 'mark',
    room: 'Q&A Room 2',
    start: '11:00',
    end: '11:25',
    track: 'Tooling',
    abstract:
      'Time-travel debugging, flaky repros, and how to make the worst bugs reproducible.',
  },
  {
    title: 'Vibe Engineering in Practice',
    speaker: 'kitze',
    room: 'Hall B',
    start: '13:30',
    end: '13:55',
    track: 'AI',
    abstract: 'Prompt-driven development with the guardrails that make it actually ship.',
  },
  {
    title: 'Building an RSC Framework on Rust',
    speaker: 'ryan',
    room: 'Hall A',
    start: '15:10',
    end: '15:35',
    track: 'Frameworks',
    abstract: 'Lessons from serializing the RSC payload natively on a Rust runtime.',
  },
  {
    title: 'Teaching React in 2026',
    speaker: 'scott',
    room: 'Mezzanine',
    start: '16:00',
    end: '16:25',
    track: 'Community',
    abstract: 'What changed, what stuck, and how to teach the new mental models.',
  },
  {
    title: 'React Native at the Edge',
    speaker: 'kadi',
    room: 'Base Camp',
    start: '16:40',
    end: '17:05',
    track: 'Mobile',
    abstract: 'Shipping delightful native experiences with Expo Router.',
  },
]

const ROOMS = ['Summit Stage', 'Hall A', 'Hall B', 'Q&A Room 2', 'Mezzanine', 'Base Camp']

async function seed() {
  console.log('Resetting domain tables…')
  // Children → parents.
  for (const table of [
    sessionSpeaker,
    moment,
    note,
    answer,
    question,
    discussionPost,
    discussion,
    projectMember,
    project,
    conferenceSession,
    room,
  ]) {
    await db.delete(table)
  }
  await db.delete(conference)
  await db.execute(sql`delete from "profile" where user_id like 'u\\_%'`)
  await db.execute(sql`delete from "user" where email like '%@demo.converge'`)

  console.log('Inserting conference + rooms…')
  const [conf] = await db
    .insert(conference)
    .values({
      slug: 'react-summit-2026',
      name: 'React Summit 2026',
      tagline: 'The biggest React conference, in Amsterdam.',
      description: 'Two days of React, in Amsterdam.',
      timezone: 'Europe/Amsterdam',
      startsAt: at('09:00'),
      endsAt: at('18:00'),
      venueName: 'Theater Amsterdam',
    })
    .returning()

  const roomIds = new Map<string, string>()
  for (const name of ROOMS) {
    const [r] = await db
      .insert(room)
      .values({ conferenceId: conf.id, name })
      .returning()
    roomIds.set(name, r.id)
  }

  console.log(`Inserting ${PEOPLE.length} people…`)
  const userIds = new Map<string, string>()
  for (const p of PEOPLE) {
    const id = `u_${p.handle}`
    userIds.set(p.handle, id)
    await db.insert(user).values({
      id,
      name: p.name,
      email: `${p.handle}@demo.converge`,
      emailVerified: true,
    })
    await db.insert(profile).values({
      userId: id,
      handle: p.handle,
      headline: `${p.title} · ${p.company}`,
      title: p.title,
      company: p.company,
      bio: p.bio,
      location: p.location,
      intents: [p.intent],
      currentFocus: p.focus,
      interestedTopics: p.topics,
      notInterestedTopics: p.dislikes,
      socials: p.socials,
    })
  }

  console.log(`Inserting ${PROJECTS.length} projects…`)
  for (const pr of PROJECTS) {
    const ownerId = userIds.get(pr.owner)!
    const [row] = await db
      .insert(project)
      .values({
        slug: pr.slug,
        ownerId,
        name: pr.name,
        tagline: pr.tagline,
        description: pr.description,
        category: pr.category,
        techStack: pr.stack,
        lookingFor: [pr.seeks],
        trendingScore: pr.stars,
      })
      .returning()
    await db
      .insert(projectMember)
      .values({ projectId: row.id, userId: ownerId, role: 'Creator' })
  }

  console.log(`Inserting ${TALKS.length} sessions…`)
  const sessionIds = new Map<string, string>()
  for (const t of TALKS) {
    const [s] = await db
      .insert(conferenceSession)
      .values({
        conferenceId: conf.id,
        roomId: roomIds.get(t.room),
        title: t.title,
        abstract: t.abstract,
        track: t.track,
        startsAt: at(t.start),
        endsAt: at(t.end),
      })
      .returning()
    sessionIds.set(t.title, s.id)
    await db
      .insert(sessionSpeaker)
      .values({ sessionId: s.id, userId: userIds.get(t.speaker)! })
  }

  console.log('Inserting a Q&A thread + meetup discussion…')
  const rscSession = sessionIds.get('What RSCs Can Do in Next.js Today')!
  const [q] = await db
    .insert(question)
    .values({
      sessionId: rscSession,
      authorId: userIds.get('mark')!,
      body: 'Does this play nicely with TanStack Query, or is the server cache meant to replace it entirely?',
      status: 'answered',
      upvotes: 48,
    })
    .returning()
  await db.insert(answer).values({
    questionId: q.id,
    authorId: userIds.get('aurora')!,
    body: "They compose, actually. Keep TanStack Query for client-driven, interactive data; let RSCs own the first load. The server cache isn't trying to be your query client.",
    fromSpeaker: true,
  })
  await db.insert(question).values({
    sessionId: rscSession,
    authorId: userIds.get('faris')!,
    body: "What's the story for error boundaries when a server action fails mid-stream?",
    upvotes: 31,
  })

  const [disc] = await db
    .insert(discussion)
    .values({
      conferenceId: conf.id,
      title: 'Coffee: RSC data-fetching patterns',
      topic: 'react-server-components',
      sessionId: rscSession,
      questionId: q.id,
      createdById: userIds.get('kitze')!,
    })
    .returning()
  await db.insert(discussionPost).values({
    discussionId: disc.id,
    authorId: userIds.get('kitze')!,
    body: "I've got a repo wiring RSCs and TanStack Query side by side — will drop a link in #react-server-components.",
  })

  console.log('✓ Seed complete.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
