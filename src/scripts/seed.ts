/**
 * Seed Converge with realistic mock data.
 *
 * Models two co-located Amsterdam conferences — JSNation and React Summit —
 * with rich people-first data: profiles, projects, talks, moments, notes,
 * Q&A, discussions, the messages and connections that outlast the event.
 *
 * Idempotent: truncates the domain + user tables, then reseeds. Run with:
 *   bun run db:seed
 */
import { sql } from 'drizzle-orm'

import { db } from '#/db'
import { user } from '#/db/auth-schema'
import {
  answer,
  conference,
  conferenceMember,
  conferenceSession,
  connection,
  discussion,
  discussionPost,
  message,
  moment,
  note,
  profile,
  project,
  projectMember,
  question,
  room,
  sessionSpeaker,
  task,
} from '#/db/domain-schema'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

/** Build a Date from a base day + "HH:MM" local-ish offset. */
const at = (day: string, time: string) => new Date(`${day}T${time}:00+02:00`)

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`

const shot = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/750`

/* ------------------------------------------------------------------ */
/* People                                                             */
/* ------------------------------------------------------------------ */

type PersonSeed = {
  key: string
  name: string
  email: string
  handle: string
  headline: string
  company: string
  title: string
  bio: string
  location: string
  intents: string[]
  currentFocus: string
  interestedTopics: string[]
  notInterestedTopics?: string[]
  availability?: 'open' | 'busy' | 'dnd'
  socials: Record<string, string>
}

const people: PersonSeed[] = [
  {
    key: 'mara',
    name: 'Mara Devries',
    email: 'mara.devries@converge.seed',
    handle: 'maradev',
    headline: 'Staff engineer obsessed with rendering performance',
    company: 'Vercel',
    title: 'Staff Software Engineer',
    bio: 'I work on the React core integration in Next.js. Spent the last year deep in the weeds of streaming SSR and the new compiler. Ask me about hydration.',
    location: 'Amsterdam, NL',
    intents: ['speaking', 'hiring', 'meet maintainers'],
    currentFocus: 'Making partial pre-rendering boring and reliable',
    interestedTopics: ['react', 'performance', 'compilers', 'ssr'],
    availability: 'busy',
    socials: { x: 'maradev', github: 'maradev', site: 'https://mara.dev' },
  },
  {
    key: 'theo',
    name: 'Theo Almeida',
    email: 'theo.almeida@converge.seed',
    handle: 'theoa',
    headline: 'DX engineer & conference regular',
    company: 'Independent',
    title: 'Developer Advocate',
    bio: 'TypeScript maximalist. I make videos about why your stack is too complicated and then ship something equally complicated.',
    location: 'Lisbon, PT',
    intents: ['speaking', 'collaboration', 'fun'],
    currentFocus: 'A type-safe RPC layer that nobody asked for',
    interestedTopics: ['typescript', 'dx', 'edge', 'trpc'],
    availability: 'open',
    socials: { x: 'theoa', github: 'theoa', youtube: 'theoalmeida' },
  },
  {
    key: 'sasha',
    name: 'Sasha Kowalski',
    email: 'sasha.kowalski@converge.seed',
    handle: 'sashak',
    headline: 'Maintainer of a state management library you probably use',
    company: 'Open source',
    title: 'OSS Maintainer',
    bio: 'I maintain a couple of TanStack-adjacent libraries. Mostly here to meet the people who file my issues.',
    location: 'Kraków, PL',
    intents: ['meet contributors', 'feedback', 'hiring'],
    currentFocus: 'A sync engine for local-first apps',
    interestedTopics: ['state-management', 'local-first', 'react', 'sqlite'],
    availability: 'open',
    socials: { github: 'sashak', x: 'sashak' },
  },
  {
    key: 'imani',
    name: 'Imani Okafor',
    email: 'imani.okafor@converge.seed',
    handle: 'imani',
    headline: 'Frontend lead building design systems at scale',
    company: 'Adyen',
    title: 'Frontend Lead',
    bio: 'Design systems, accessibility, and the unglamorous work of keeping 200 engineers consistent. CSS is a programming language and I will die on this hill.',
    location: 'Amsterdam, NL',
    intents: ['hiring', 'learning', 'mentoring'],
    currentFocus: 'Migrating our tokens to CSS-first config',
    interestedTopics: ['design-systems', 'accessibility', 'css', 'tailwind'],
    availability: 'open',
    socials: { x: 'imani', linkedin: 'imani-okafor' },
  },
  {
    key: 'lukas',
    name: 'Lukas Brandt',
    email: 'lukas.brandt@converge.seed',
    handle: 'lukasb',
    headline: 'Node.js core contributor, runtime nerd',
    company: 'Platformatic',
    title: 'Principal Engineer',
    bio: 'I spend my days making the event loop faster and my nights explaining why your benchmark is wrong.',
    location: 'Berlin, DE',
    intents: ['speaking', 'meet maintainers', 'collaboration'],
    currentFocus: 'Diagnostics tooling for production Node',
    interestedTopics: ['nodejs', 'performance', 'observability', 'runtimes'],
    availability: 'busy',
    socials: { github: 'lukasb', x: 'lukasb' },
  },
  {
    key: 'yuki',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@converge.seed',
    handle: 'yuki',
    headline: 'Building the future of edge rendering',
    company: 'Cloudflare',
    title: 'Systems Engineer',
    bio: 'Workers, durable objects, and making the cold start disappear. Previously games.',
    location: 'Tokyo, JP',
    intents: ['speaking', 'feedback', 'hiring'],
    currentFocus: 'Streaming React from the edge with zero config',
    interestedTopics: ['edge', 'react', 'wasm', 'performance'],
    availability: 'open',
    socials: { github: 'yuki', x: 'yukidev' },
  },
  {
    key: 'noa',
    name: 'Noa Hartman',
    email: 'noa.hartman@converge.seed',
    handle: 'noah',
    headline: 'Indie hacker, ex-big-tech, currently bootstrapping',
    company: 'Tidereel (solo)',
    title: 'Founder',
    bio: 'Left a comfortable job to build a tiny analytics product. Looking for my first hire and a lot of feedback.',
    location: 'Rotterdam, NL',
    intents: ['co-founder', 'users', 'feedback', 'hiring'],
    currentFocus: 'Privacy-first product analytics for indie devs',
    interestedTopics: ['startups', 'analytics', 'react', 'sqlite'],
    availability: 'open',
    socials: { x: 'noahbuilds', github: 'noah' },
  },
  {
    key: 'devin',
    name: 'Devin Park',
    email: 'devin.park@converge.seed',
    handle: 'devinp',
    headline: 'Full-stack dev, first conference!',
    company: 'Mollie',
    title: 'Software Engineer',
    bio: 'Two years into my career, here to learn everything and lose my badge at least once.',
    location: 'Amsterdam, NL',
    intents: ['learning', 'meet people', 'job-curious'],
    currentFocus: 'Getting comfortable with server components',
    interestedTopics: ['react', 'nextjs', 'career', 'typescript'],
    availability: 'open',
    socials: { github: 'devinp' },
  },
  {
    key: 'priya',
    name: 'Priya Nair',
    email: 'priya.nair@converge.seed',
    handle: 'priya',
    headline: 'Engineering manager, ex-IC who still reviews PRs',
    company: 'Booking.com',
    title: 'Engineering Manager',
    bio: 'I lead a platform team of 9. Here to steal ideas about developer experience and bring them home.',
    location: 'Amsterdam, NL',
    intents: ['hiring', 'learning', 'mentoring'],
    currentFocus: 'Cutting our CI times in half',
    interestedTopics: ['dx', 'leadership', 'monorepos', 'testing'],
    availability: 'open',
    socials: { linkedin: 'priya-nair', x: 'priyaleads' },
  },
  {
    key: 'finn',
    name: 'Finn Olsen',
    email: 'finn.olsen@converge.seed',
    handle: 'finn',
    headline: 'Animation & creative coding',
    company: 'Active Theory',
    title: 'Creative Developer',
    bio: 'WebGL, shaders, and the kind of scroll-jacking everyone says they hate but secretly loves.',
    location: 'Copenhagen, DK',
    intents: ['collaboration', 'speaking', 'fun'],
    currentFocus: 'A WebGPU particle system for the web',
    interestedTopics: ['webgl', 'webgpu', 'animation', 'creative-coding'],
    availability: 'open',
    socials: { x: 'finncodes', github: 'finn', site: 'https://finn.gl' },
  },
  {
    key: 'aisha',
    name: 'Aisha Rahman',
    email: 'aisha.rahman@converge.seed',
    handle: 'aisha',
    headline: 'Testing advocate & flaky-test exorcist',
    company: 'Playwright (Microsoft)',
    title: 'Developer Advocate',
    bio: 'If your test is flaky, it is lying to you. Let me help you fix it.',
    location: 'London, UK',
    intents: ['speaking', 'teaching', 'feedback'],
    currentFocus: 'Component testing that does not make you cry',
    interestedTopics: ['testing', 'e2e', 'dx', 'ci'],
    availability: 'open',
    socials: { github: 'aisha', x: 'aishatests' },
  },
  {
    key: 'tom',
    name: 'Tom Verhoeven',
    email: 'tom.verhoeven@converge.seed',
    handle: 'tomv',
    headline: 'Recruiter who actually codes',
    company: 'Frontend Talent',
    title: 'Technical Recruiter',
    bio: 'I place senior frontend engineers across the EU. I read your GitHub before I message you.',
    location: 'Utrecht, NL',
    intents: ['hiring', 'meet people'],
    currentFocus: 'Filling 6 senior React roles this quarter',
    interestedTopics: ['careers', 'react', 'hiring'],
    notInterestedTopics: ['webgl'],
    availability: 'open',
    socials: { linkedin: 'tom-verhoeven' },
  },
  {
    key: 'elena',
    name: 'Elena Costa',
    email: 'elena.costa@converge.seed',
    handle: 'elena',
    headline: 'DevRel & community builder',
    company: 'Sentry',
    title: 'Head of DevRel',
    bio: 'Errors happen. I help teams find them before users do. Also I run three Discord servers.',
    location: 'Barcelona, ES',
    intents: ['speaking', 'community', 'feedback'],
    currentFocus: 'Tracing across server components',
    interestedTopics: ['observability', 'community', 'react', 'performance'],
    availability: 'open',
    socials: { x: 'elenacosta', github: 'elena' },
  },
  {
    key: 'sven',
    name: 'Sven Eriksson',
    email: 'sven.eriksson@converge.seed',
    handle: 'sven',
    headline: 'Build tooling, bundlers, and pain',
    company: 'Vite team',
    title: 'Core Maintainer',
    bio: 'I make your dev server fast and then you tell me it is slow. Rust, esbuild, and Rolldown.',
    location: 'Stockholm, SE',
    intents: ['meet contributors', 'speaking', 'feedback'],
    currentFocus: 'Rolldown migration for large monorepos',
    interestedTopics: ['build-tools', 'rust', 'bundlers', 'dx'],
    availability: 'busy',
    socials: { github: 'sven', x: 'svenbuilds' },
  },
  {
    key: 'grace',
    name: 'Grace Mwangi',
    email: 'grace.mwangi@converge.seed',
    handle: 'grace',
    headline: 'Mobile & React Native, bridging the gap',
    company: 'Shopify',
    title: 'Senior Mobile Engineer',
    bio: 'React Native at scale. The new architecture is good, actually. Let me convince you.',
    location: 'Nairobi, KE',
    intents: ['speaking', 'learning', 'meet people'],
    currentFocus: 'Migrating a huge app to the new RN architecture',
    interestedTopics: ['react-native', 'mobile', 'performance', 'react'],
    availability: 'open',
    socials: { github: 'grace', x: 'gracecodes' },
  },
  {
    key: 'jonas',
    name: 'Jonas Weber',
    email: 'jonas.weber@converge.seed',
    handle: 'jonasw',
    headline: 'AI-curious backend engineer',
    company: 'DeepL',
    title: 'Backend Engineer',
    bio: 'Mostly here for the hallway track and to figure out if I should care about all this AI tooling.',
    location: 'Cologne, DE',
    intents: ['learning', 'meet people', 'job-curious'],
    currentFocus: 'Streaming LLM responses without melting the server',
    interestedTopics: ['ai', 'nodejs', 'streaming', 'edge'],
    availability: 'open',
    socials: { github: 'jonasw' },
  },
]

/* ------------------------------------------------------------------ */
/* Conferences                                                        */
/* ------------------------------------------------------------------ */

const JSNATION_DAY = '2025-06-12'
const REACT_SUMMIT_DAY = '2025-06-13'

/* ------------------------------------------------------------------ */
/* Seed                                                               */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log('🌱 Seeding Converge…')

  // Clean slate (cascade clears all domain rows referencing users/conferences).
  await db.execute(sql`
    truncate table
      ${task}, ${connection}, ${message}, ${discussionPost},
      ${discussion}, ${answer}, ${question}, ${note}, ${moment},
      ${sessionSpeaker}, ${conferenceSession}, ${room},
      ${projectMember}, ${project}, ${conferenceMember}, ${profile},
      ${conference}, ${user}
    restart identity cascade
  `)

  /* --- users + profiles --- */
  const userIds = new Map<string, string>()
  for (const p of people) {
    const id = uid()
    userIds.set(p.key, id)
    await db.insert(user).values({
      id,
      name: p.name,
      email: p.email,
      emailVerified: true,
      image: avatar(p.handle),
    })
    await db.insert(profile).values({
      userId: id,
      handle: p.handle,
      headline: p.headline,
      company: p.company,
      title: p.title,
      bio: p.bio,
      location: p.location,
      intents: p.intents,
      currentFocus: p.currentFocus,
      interestedTopics: p.interestedTopics,
      notInterestedTopics: p.notInterestedTopics ?? null,
      availability: p.availability ?? 'open',
      socials: p.socials,
    })
  }
  const U = (key: string) => userIds.get(key)!
  console.log(`  ✓ ${people.length} people`)

  /* --- conferences + rooms --- */
  const jsnationId = uid()
  const reactSummitId = uid()

  await db.insert(conference).values([
    {
      id: jsnationId,
      slug: 'jsnation-amsterdam-2025',
      name: 'JSNation Amsterdam 2025',
      tagline: 'The JavaScript conference for the community',
      description:
        'A full day of pure JavaScript — Node.js, runtimes, build tooling, the web platform, and everything in between. Co-located with React Summit at RAI Amsterdam.',
      timezone: 'Europe/Amsterdam',
      startsAt: at(JSNATION_DAY, '09:00'),
      endsAt: at(JSNATION_DAY, '18:30'),
      venueName: 'RAI Amsterdam',
    },
    {
      id: reactSummitId,
      slug: 'react-summit-amsterdam-2025',
      name: 'React Summit Amsterdam 2025',
      tagline: 'The biggest React conference worldwide',
      description:
        'Two thousand React developers, one venue. Talks on React internals, server components, performance, React Native, and the future of the framework.',
      timezone: 'Europe/Amsterdam',
      startsAt: at(REACT_SUMMIT_DAY, '09:00'),
      endsAt: at(REACT_SUMMIT_DAY, '18:30'),
      venueName: 'RAI Amsterdam',
    },
  ])

  const rooms = {
    jsMain: uid(),
    jsAtrium: uid(),
    rsMain: uid(),
    rsCommunity: uid(),
    rsWorkshop: uid(),
  }
  await db.insert(room).values([
    { id: rooms.jsMain, conferenceId: jsnationId, name: 'Forum Hall', floor: 'Ground', capacity: 1600, location: { lat: 52.341, lng: 4.889 } },
    { id: rooms.jsAtrium, conferenceId: jsnationId, name: 'Atrium Stage', floor: '1', capacity: 400, location: { lat: 52.3412, lng: 4.8895 } },
    { id: rooms.rsMain, conferenceId: reactSummitId, name: 'Forum Hall', floor: 'Ground', capacity: 1600, location: { lat: 52.341, lng: 4.889 } },
    { id: rooms.rsCommunity, conferenceId: reactSummitId, name: 'Community Stage', floor: '1', capacity: 500, location: { lat: 52.3413, lng: 4.8898 } },
    { id: rooms.rsWorkshop, conferenceId: reactSummitId, name: 'Workshop Room E', floor: '2', capacity: 80 },
  ])
  console.log('  ✓ 2 conferences, 5 rooms')

  /* --- conference membership + roles --- */
  type Membership = [conf: string, role: string, keys: string[]]
  const memberships: Membership[] = [
    // JSNation
    [jsnationId, 'organizer', ['elena']],
    [jsnationId, 'speaker', ['lukas', 'sven', 'jonas', 'theo']],
    [jsnationId, 'sponsor', ['tom']],
    [jsnationId, 'attendee', ['mara', 'devin', 'priya', 'noa', 'jonas', 'yuki', 'aisha']],
    // React Summit
    [reactSummitId, 'organizer', ['elena']],
    [reactSummitId, 'speaker', ['mara', 'sasha', 'yuki', 'grace', 'aisha', 'finn']],
    [reactSummitId, 'sponsor', ['tom']],
    [reactSummitId, 'attendee', ['theo', 'imani', 'devin', 'priya', 'noa', 'jonas', 'lukas']],
  ]
  let memberCount = 0
  for (const [confId, role, keys] of memberships) {
    for (const k of keys) {
      await db
        .insert(conferenceMember)
        .values({ conferenceId: confId, userId: U(k), role })
        .onConflictDoNothing()
      memberCount++
    }
  }
  console.log(`  ✓ ${memberCount} conference memberships`)

  /* --- projects --- */
  type ProjectSeed = {
    key: string
    owner: string
    slug: string
    name: string
    tagline: string
    description: string
    category: string
    techStack: string[]
    lookingFor: string[]
    links: Record<string, string>
    trendingScore: number
    members?: Array<[key: string, role: string]>
  }
  const projects: ProjectSeed[] = [
    {
      key: 'tidereel',
      owner: 'noa',
      slug: 'tidereel',
      name: 'Tidereel',
      tagline: 'Privacy-first analytics that fits in a single script tag',
      description:
        'Cookieless, GDPR-friendly product analytics aimed at indie developers and small teams. No dashboards you need a PhD to read.',
      category: 'startup',
      techStack: ['TanStack Start', 'SQLite', 'Drizzle', 'Tailwind'],
      lookingFor: ['co-founder', 'users', 'feedback'],
      links: { site: 'https://tidereel.dev', github: 'noah/tidereel' },
      trendingScore: 87,
      members: [['devin', 'contributor']],
    },
    {
      key: 'glasswire',
      owner: 'sasha',
      slug: 'glasswire-sync',
      name: 'Glasswire Sync',
      tagline: 'A local-first sync engine for React apps',
      description:
        'Offline-first state that syncs when you reconnect, with conflict resolution that mostly does the right thing. Built on SQLite + CRDTs.',
      category: 'open-source',
      techStack: ['TypeScript', 'SQLite', 'React', 'CRDTs'],
      lookingFor: ['contributors', 'feedback', 'early adopters'],
      links: { github: 'sashak/glasswire', docs: 'https://glasswire.dev' },
      trendingScore: 142,
      members: [['mara', 'advisor'], ['yuki', 'contributor']],
    },
    {
      key: 'particula',
      owner: 'finn',
      slug: 'particula',
      name: 'Particula',
      tagline: 'A WebGPU particle playground for the web',
      description:
        'Million-particle simulations running at 120fps in the browser. A creative-coding toy that turned into a real library.',
      category: 'side-project',
      techStack: ['WebGPU', 'TypeScript', 'wgsl'],
      lookingFor: ['collaborators', 'feedback'],
      links: { demo: 'https://particula.gl', github: 'finn/particula' },
      trendingScore: 64,
    },
    {
      key: 'loophole',
      owner: 'lukas',
      slug: 'loophole',
      name: 'Loophole',
      tagline: 'Production-grade diagnostics for Node.js',
      description:
        'Continuous profiling and event-loop lag detection you can leave running in prod. Flamegraphs without the ceremony.',
      category: 'product',
      techStack: ['Node.js', 'Rust', 'OpenTelemetry'],
      lookingFor: ['design partners', 'feedback'],
      links: { site: 'https://loophole.tools' },
      trendingScore: 53,
      members: [['jonas', 'design-partner']],
    },
    {
      key: 'axecheck',
      owner: 'imani',
      slug: 'axecheck',
      name: 'AxeCheck',
      tagline: 'Accessibility linting that meets you in your editor',
      description:
        'Real-time a11y feedback for React components, with autofixes for the boring 80%. Born from a design-system migration gone right.',
      category: 'open-source',
      techStack: ['TypeScript', 'React', 'ESLint', 'Tailwind'],
      lookingFor: ['contributors', 'users'],
      links: { github: 'imani/axecheck' },
      trendingScore: 98,
    },
  ]
  for (const pr of projects) {
    const id = uid()
    await db.insert(project).values({
      id,
      slug: pr.slug,
      ownerId: U(pr.owner),
      name: pr.name,
      tagline: pr.tagline,
      description: pr.description,
      category: pr.category,
      techStack: pr.techStack,
      lookingFor: pr.lookingFor,
      screenshots: [shot(`${pr.slug}-1`), shot(`${pr.slug}-2`)],
      links: pr.links,
      trendingScore: pr.trendingScore,
    })
    // owner is implicitly a member; add explicit members too
    await db.insert(projectMember).values({ projectId: id, userId: U(pr.owner), role: 'owner' }).onConflictDoNothing()
    for (const [k, role] of pr.members ?? []) {
      await db.insert(projectMember).values({ projectId: id, userId: U(k), role }).onConflictDoNothing()
    }
  }
  console.log(`  ✓ ${projects.length} projects`)

  /* --- sessions (talks) --- */
  type SessionSeed = {
    key: string
    conf: string
    room: string
    title: string
    abstract: string
    track: string
    start: string
    end: string
    speakers: string[]
    aiSummary?: string
    livestreamUrl?: string
  }
  const day = (conf: string) => (conf === jsnationId ? JSNATION_DAY : REACT_SUMMIT_DAY)

  const sessions: SessionSeed[] = [
    // --- JSNation ---
    {
      key: 'js-opening',
      conf: jsnationId, room: rooms.jsMain,
      title: 'Opening Keynote: The State of JavaScript',
      abstract:
        'Where the language, the runtimes, and the ecosystem stand in 2025 — and the three bets worth making for the next two years.',
      track: 'Keynote', start: '09:15', end: '09:55', speakers: ['elena'],
      aiSummary:
        'Runtimes are converging on web-standard APIs; build tools are going native (Rust); and the platform is finally catching up to the framework. Bet on standards.',
    },
    {
      key: 'js-eventloop',
      conf: jsnationId, room: rooms.jsMain,
      title: 'The Event Loop Is Lying to You',
      abstract:
        'A guided tour through libuv, microtasks, and the subtle ways your async code does not run when you think it does. Live debugging included.',
      track: 'Node.js & Runtimes', start: '10:10', end: '10:40', speakers: ['lukas'],
      aiSummary:
        'Microtask starvation and unawaited promises cause most "random" prod latency. Use async hooks + flamegraphs; do not trust intuition about ordering.',
    },
    {
      key: 'js-bundlers',
      conf: jsnationId, room: rooms.jsMain,
      title: 'Native-Speed Bundling: Inside Rolldown',
      abstract:
        'Why Vite is moving its production bundler to Rust, what changes for you, and the migration path for large monorepos.',
      track: 'Build Tools', start: '11:00', end: '11:30', speakers: ['sven'],
      aiSummary:
        'Rolldown replaces Rollup+esbuild with one Rust bundler — fewer inconsistencies, 3–10x faster builds. Migration is mostly transparent; watch custom plugins.',
    },
    {
      key: 'js-streaming',
      conf: jsnationId, room: rooms.jsAtrium,
      title: 'Streaming LLM Responses Without Melting Your Server',
      abstract:
        'Backpressure, cancellation, and connection limits when you proxy a token stream to thousands of clients.',
      track: 'AI & Streaming', start: '11:00', end: '11:30', speakers: ['jonas'],
    },
    {
      key: 'js-types',
      conf: jsnationId, room: rooms.jsMain,
      title: 'Type-Safe From Database to Pixel',
      abstract:
        'End-to-end type safety is finally practical. A tour of the seams where types usually break — and how to weld them shut.',
      track: 'TypeScript', start: '11:45', end: '12:15', speakers: ['theo'],
      aiSummary:
        'The weak seams are the network boundary and the ORM. Codegen + a typed RPC layer closes both. Inference beats annotation where you can get it.',
    },

    // --- React Summit ---
    {
      key: 'rs-opening',
      conf: reactSummitId, room: rooms.rsMain,
      title: 'Keynote: React in 2025 and Beyond',
      abstract:
        'The compiler shipped, server components are mainstream, and the mental model is shifting. What it means for how you build.',
      track: 'Keynote', start: '09:15', end: '10:00', speakers: ['mara'],
      aiSummary:
        'The React Compiler removes most manual memoization; RSC moves data-fetching to the server by default. Learn the boundary between server and client — that is the new core skill.',
      // React Summit 2024 main-stage livestream on YouTube.
      livestreamUrl: 'https://www.youtube.com/watch?v=C0dnfm48K4Q',
    },
    {
      key: 'rs-compiler',
      conf: reactSummitId, room: rooms.rsMain,
      title: 'Life After useMemo: The React Compiler in Practice',
      abstract:
        'What the compiler actually does to your code, when it bails out, and how to read its output so you can trust it.',
      track: 'React Core', start: '10:15', end: '10:45', speakers: ['mara'],
      aiSummary:
        'The compiler auto-memoizes at build time; bailouts happen on mutation and dynamic access. Keep components pure and the compiler does the rest. Delete most useMemo.',
    },
    {
      key: 'rs-rsc',
      conf: reactSummitId, room: rooms.rsCommunity,
      title: 'RSC Data-Fetching Patterns in the Wild',
      abstract:
        'How teams are actually using React Server Components for data-fetching: colocation, waterfall avoidance, and the questions nobody answered at the keynote.',
      track: 'React Core', start: '10:15', end: '10:45', speakers: ['yuki'],
      aiSummary:
        'Fetch inside the component tree, not in a global loader. Parallel data-fetching with Promise.all; sequential only when there is a real dependency. Cache at the RSC layer, not the API layer.',
    },
    {
      key: 'rs-localfirst',
      conf: reactSummitId, room: rooms.rsMain,
      title: 'Local-First React: Apps That Work on the Subway',
      abstract:
        'Building React apps where the network is an enhancement, not a requirement. Sync engines, conflict resolution, and optimistic UI that does not lie.',
      track: 'Architecture', start: '11:05', end: '11:35', speakers: ['sasha'],
      aiSummary:
        'Treat the local store as source of truth and sync in the background. CRDTs handle merges; TanStack DB-style collections give you optimistic writes for free.',
    },
    {
      key: 'rs-edge',
      conf: reactSummitId, room: rooms.rsCommunity,
      title: 'Streaming React From the Edge With Zero Config',
      abstract:
        'Server components rendered at the edge, milliseconds from the user. The architecture, the cold-start problem, and where it falls down.',
      track: 'Performance', start: '11:05', end: '11:35', speakers: ['yuki'],
      aiSummary:
        'Edge SSR cuts TTFB dramatically but data locality bites you — co-locate the DB or cache aggressively. Streaming hides latency; measure with real devices.',
    },
    {
      key: 'rs-native',
      conf: reactSummitId, room: rooms.rsMain,
      title: 'React Native’s New Architecture at Scale',
      abstract:
        'Migrating a 500-screen app to the new architecture: Fabric, TurboModules, and the bugs nobody warns you about.',
      track: 'React Native', start: '11:50', end: '12:20', speakers: ['grace'],
      aiSummary:
        'The new architecture is worth it for perf-sensitive apps but migrate incrementally. Bridgeless mode is the big win; budget time for native module rewrites.',
    },
    {
      key: 'rs-testing',
      conf: reactSummitId, room: rooms.rsCommunity,
      title: 'Component Testing That Does Not Make You Cry',
      abstract:
        'A pragmatic testing pyramid for React in 2025: what to unit test, what to test in the browser, and how to kill flakiness for good.',
      track: 'Testing', start: '11:50', end: '12:20', speakers: ['aisha'],
      aiSummary:
        'Test behavior at the component boundary in a real browser; mock the network, not React. Flakiness is almost always timing — await the UI, never the clock.',
    },
    {
      key: 'rs-webgpu',
      conf: reactSummitId, room: rooms.rsCommunity,
      title: 'Declarative WebGPU: Shaders Meet React',
      abstract:
        'Wrapping the imperative WebGPU API in a declarative React layer without throwing away 120fps.',
      track: 'Creative', start: '14:00', end: '14:30', speakers: ['finn'],
    },
  ]

  const sessionIds = new Map<string, string>()
  for (const s of sessions) {
    const id = uid()
    sessionIds.set(s.key, id)
    await db.insert(conferenceSession).values({
      id,
      conferenceId: s.conf,
      roomId: s.room,
      title: s.title,
      abstract: s.abstract,
      track: s.track,
      startsAt: at(day(s.conf), s.start),
      endsAt: at(day(s.conf), s.end),
      livestreamUrl: s.livestreamUrl ?? null,
      transcriptUrl: s.aiSummary ? `https://cdn.converge.dev/transcripts/${id}.vtt` : null,
      aiSummary: s.aiSummary ?? null,
    })
    for (const sp of s.speakers) {
      await db.insert(sessionSpeaker).values({ sessionId: id, userId: U(sp) }).onConflictDoNothing()
    }
  }
  const S = (key: string) => sessionIds.get(key)!
  console.log(`  ✓ ${sessions.length} sessions`)

  /* --- moments (bookmarked highlights within talks) --- */
  const moments: Array<{
    session: string; user: string; ms: number; snippet: string; note?: string; slide?: string; ai?: boolean
  }> = [
    { session: 'rs-compiler', user: 'devin', ms: 8 * 60_000, snippet: 'You can basically delete most of your useMemo and useCallback calls.', note: 'Finally. Try this on the checkout page Monday.', slide: '#14', ai: true },
    { session: 'rs-compiler', user: 'priya', ms: 18 * 60_000, snippet: 'The compiler bails out the moment it sees a mutation it cannot prove is safe.', note: 'This is the gotcha for our team' },
    { session: 'rs-opening', user: 'theo', ms: 22 * 60_000, snippet: 'The boundary between server and client is the new core skill.', ai: true },
    { session: 'rs-localfirst', user: 'noa', ms: 12 * 60_000, snippet: 'Treat your local store as the source of truth and sync in the background.', note: 'This is exactly the model for Tidereel offline mode', slide: '#9' },
    { session: 'rs-edge', user: 'jonas', ms: 9 * 60_000, snippet: 'Edge SSR wins on TTFB but data locality will bite you.', note: 'Need to check where DeepL data lives' },
    { session: 'js-eventloop', user: 'devin', ms: 14 * 60_000, snippet: 'An unawaited promise is a bug that will page you at 3am.', ai: true },
    { session: 'js-bundlers', user: 'priya', ms: 11 * 60_000, snippet: '3 to 10x faster production builds for large monorepos.', note: 'CI time goal — flag for the platform team' },
    { session: 'rs-testing', user: 'devin', ms: 16 * 60_000, snippet: 'Flakiness is almost always timing. Await the UI, never the clock.', slide: '#21' },
    { session: 'rs-native', user: 'grace', ms: 25 * 60_000, snippet: 'Bridgeless mode is the single biggest win in the new architecture.', ai: true },
    { session: 'js-streaming', user: 'theo', ms: 7 * 60_000 + 30_000, snippet: 'Backpressure is the hidden cost nobody benchmarks — your client will buffer silently until it doesn\'t.', note: 'Check if our streaming proxy handles this', slide: '#5', ai: true },
    { session: 'js-streaming', user: 'finn', ms: 12 * 60_000, snippet: 'Abort controllers are your best friend. If the user navigates away, you have to stop the model.', slide: '#8' },
    { session: 'js-streaming', user: 'imani', ms: 18 * 60_000, snippet: 'Token budget on the server side — never let the model output more than the UI can meaningfully render.', note: 'Hard limit for our chat feature' },
  ]
  for (const m of moments) {
    await db.insert(moment).values({
      sessionId: S(m.session),
      userId: U(m.user),
      timestampMs: m.ms,
      transcriptSnippet: m.snippet,
      slideRef: m.slide ?? null,
      note: m.note ?? null,
      aiHighlight: m.ai ?? false,
    })
  }
  console.log(`  ✓ ${moments.length} moments`)

  /* --- notes --- */
  const notes: Array<{ user: string; session?: string; kind?: string; body: string }> = [
    { user: 'devin', session: 'rs-compiler', body: 'TODO: audit our codebase for manual memoization once we upgrade. Ask Priya if we can bump React this quarter.' },
    { user: 'priya', session: 'js-bundlers', body: 'Rolldown could cut our CI by half. Action: spike on the design-system repo first (smallest blast radius).' },
    { user: 'noa', session: 'rs-localfirst', body: 'Glasswire Sync might be the answer for offline. Talk to Sasha — could save me months.' },
    { user: 'jonas', kind: 'voice', body: 'Voice memo: ask the edge talk speaker how they handle DB latency from the edge. Recorded in the hallway.' },
    { user: 'theo', session: 'rs-opening', body: 'Server/client boundary as the core skill — good framing for the next video.' },
    { user: 'grace', body: 'Hallway idea: a workshop on incremental RN architecture migration. There is clearly demand.' },
  ]
  for (const n of notes) {
    await db.insert(note).values({
      userId: U(n.user),
      sessionId: n.session ? S(n.session) : null,
      kind: n.kind ?? 'text',
      body: n.body,
      audioUrl: n.kind === 'voice' ? `https://cdn.converge.dev/notes/${uid()}.webm` : null,
    })
  }
  console.log(`  ✓ ${notes.length} notes`)

  /* --- questions + answers --- */
  const questionIds = new Map<string, string>()
  const questions: Array<{
    key: string; session: string; author: string; body: string; status?: string; upvotes: number
    answers?: Array<{ author: string; body: string; fromSpeaker?: boolean }>
  }> = [
    {
      key: 'q-compiler-eslint',
      session: 'rs-compiler', author: 'devin', upvotes: 47, status: 'answered',
      body: 'If the compiler memoizes everything, is the react-hooks/exhaustive-deps lint rule still useful?',
      answers: [
        { author: 'mara', fromSpeaker: true, body: 'Yes — the rule still catches genuinely missing dependencies that would change behaviour, not just performance. Keep it on.' },
        { author: 'theo', body: 'Was about to ask the same thing. Good to know.' },
      ],
    },
    {
      key: 'q-compiler-bailout',
      session: 'rs-compiler', author: 'priya', upvotes: 31, status: 'answered',
      body: 'How do we know when the compiler has bailed out on a component in production?',
      answers: [
        { author: 'mara', fromSpeaker: true, body: 'The React DevTools shows a “Memo ✨” badge on compiled components. No badge means it bailed — usually a mutation or a ref escape.' },
      ],
    },
    {
      key: 'q-localfirst-conflict',
      session: 'rs-localfirst', author: 'noa', upvotes: 22, status: 'answered',
      body: 'For conflict resolution, do you ever need to surface a merge UI to the user, or do CRDTs always resolve silently?',
      answers: [
        { author: 'sasha', fromSpeaker: true, body: 'CRDTs always converge to *a* value, but it is not always the value a human wants. For high-stakes fields (money, names) I still show a “these changed elsewhere” prompt.' },
      ],
    },
    {
      key: 'q-edge-db',
      session: 'rs-edge', author: 'jonas', upvotes: 19, status: 'open',
      body: 'If my Postgres is in one region, does edge SSR actually help, or am I just adding a hop?',
    },
    {
      key: 'q-native-migrate',
      session: 'rs-native', author: 'devin', upvotes: 14, status: 'open',
      body: 'Can you run the old and new architecture side by side during a migration, or is it all-or-nothing?',
    },
    {
      key: 'q-testing-msw',
      session: 'rs-testing', author: 'priya', upvotes: 26, status: 'answered',
      body: 'Do you recommend mocking the network at the fetch level or with a service worker like MSW?',
      answers: [
        { author: 'aisha', fromSpeaker: true, body: 'MSW, every time. Mocking fetch leaks implementation details into your tests; intercepting at the network layer means your test does not care how you fetch.' },
      ],
    },
    {
      key: 'q-streaming-backpressure',
      session: 'js-streaming', author: 'theo', upvotes: 28, status: 'answered',
      body: 'How do you handle backpressure when the client can\'t consume tokens as fast as the model produces them?',
      answers: [
        { author: 'jonas', fromSpeaker: true, body: 'ReadableStream with a TransformStream as a token buffer. If the queue depth exceeds a threshold I pause the upstream and let the UI drain. The key is never dropping tokens — buffering is fine, losing data is not.' },
        { author: 'theo', body: 'This is the piece I was missing. Going to spike on this tomorrow.' },
      ],
    },
    {
      key: 'q-streaming-abort',
      session: 'js-streaming', author: 'lukas', upvotes: 21, status: 'answered',
      body: 'If the user cancels mid-stream, does the model keep running and billing you on the server?',
      answers: [
        { author: 'jonas', fromSpeaker: true, body: 'Yes, unless you propagate the AbortSignal all the way through. Pass it to the fetch, then forward it to the SDK. Most providers stop billing the moment the connection drops — but you have to actually close it.' },
      ],
    },
    {
      key: 'q-streaming-edge',
      session: 'js-streaming', author: 'finn', upvotes: 15, status: 'open',
      body: 'Does streaming LLM responses work well from edge runtimes, or does the cold start kill the TTFT advantage?',
    },
    {
      key: 'q-rsc-tanstack-query',
      session: 'rs-rsc', author: 'devin', upvotes: 34, status: 'answered',
      body: 'Does this play nicely with TanStack Query, or do RSC and client-side caching just fight each other the whole time?',
      answers: [
        { author: 'yuki', fromSpeaker: true, body: 'They are complementary, not competing. RSC handles the initial fetch and server mutations; TanStack Query owns the client cache and real-time invalidation. The boundary is the serialization point — what crosses the RSC / client boundary is data, not cache state.' },
        { author: 'noa', body: 'We use both in Tidereel. RSC for the page shell, Query for everything that updates without a navigation. The only footgun is deduplication — make sure you are not fetching the same data twice.' },
      ],
    },
  ]
  for (const q of questions) {
    const id = uid()
    questionIds.set(q.key, id)
    await db.insert(question).values({
      id,
      sessionId: S(q.session),
      authorId: U(q.author),
      body: q.body,
      status: q.status ?? 'open',
      upvotes: q.upvotes,
    })
    for (const a of q.answers ?? []) {
      await db.insert(answer).values({
        questionId: id,
        authorId: U(a.author),
        body: a.body,
        fromSpeaker: a.fromSpeaker ?? false,
      })
    }
  }
  console.log(`  ✓ ${questions.length} questions + answers`)

  /* --- discussions + threaded posts --- */
  type Post = { author: string; body: string; replies?: Post[] }
  const discussions: Array<{
    title: string; topic?: string; conf?: string; session?: string; project?: string; question?: string
    createdBy: string; posts: Post[]
  }> = [
    {
      title: 'React Compiler: who has shipped it to prod?',
      topic: 'react-compiler',
      conf: reactSummitId, session: 'rs-compiler', question: 'q-compiler-bailout',
      createdBy: 'devin',
      posts: [
        { author: 'devin', body: 'After Mara’s talk I’m convinced. Anyone running the compiler in production already? What broke?', replies: [
          { author: 'mara', body: 'We’ve had it on for ~6 months at work. The only real surprise was a few components that mutated props in render — those bailed silently until we fixed them.' },
          { author: 'priya', body: 'We’re gated on a React upgrade. Mara, did you need any codemods or was it just turning the plugin on?', replies: [
            { author: 'mara', body: 'Just the Babel/SWC plugin + the eslint plugin to catch rule-of-React violations. No codemod.' },
          ] },
        ] },
        { author: 'theo', body: 'Doing a video on this. Will link the repo here when it’s up.' },
      ],
    },
    {
      title: 'Local-first: is it ready for real apps?',
      topic: 'local-first',
      conf: reactSummitId, session: 'rs-localfirst', project: 'glasswire',
      createdBy: 'noa',
      posts: [
        { author: 'noa', body: 'Sasha’s sync engine looks like exactly what I need for Tidereel’s offline mode. Anyone using Glasswire in anger yet?', replies: [
          { author: 'sasha', body: 'It’s early but stable for single-user-multi-device. Multi-user collaboration is the next milestone. Happy to pair if you want to try it.' },
          { author: 'yuki', body: 'I contributed the edge-sync adapter — works great with Durable Objects if you go that route.' },
        ] },
      ],
    },
    {
      title: 'Cutting CI time — war stories wanted',
      topic: 'ci-performance',
      conf: jsnationId, session: 'js-bundlers',
      createdBy: 'priya',
      posts: [
        { author: 'priya', body: 'Goal: halve our CI. Rolldown for builds is one lever. What else moved the needle for you?', replies: [
          { author: 'sven', body: 'Bundling is usually not the bottleneck — test sharding and a remote cache usually win bigger. But yes, Rolldown helps the build step.' },
          { author: 'aisha', body: 'Parallelise your e2e suite and kill flaky retries. A flaky test that retries 3x is 3x the CI cost.' },
          { author: 'lukas', body: 'Profile the runner itself. We found 40% of our “CI time” was just installing dependencies.' },
        ] },
      ],
    },
    {
      title: 'Coffee: RSC data-fetching patterns',
      topic: 'react-server-components',
      conf: reactSummitId, session: 'rs-rsc', question: 'q-rsc-tanstack-query',
      createdBy: 'devin',
      posts: [
        { author: 'devin', body: "After Yuki's talk I want to nail down when to reach for RSC vs TanStack Query for data. Anyone settled on a pattern they're happy with?", replies: [
          { author: 'yuki', body: 'Rule of thumb I use: if the data is only needed for the initial render and does not change while the user is on the page, RSC. If it can be invalidated, refetched, or mutated by the client, TanStack Query. Most pages need both.' },
          { author: 'noa', body: 'We went further and wrote a decision tree for our team. RSC for page-level queries that depend on URL params, Query for everything inside interactive components. Has basically eliminated the "which one do I use" conversation.', replies: [
            { author: 'devin', body: 'Would love a link to that decision tree if you are open to sharing it.' },
            { author: 'noa', body: "I'll clean it up and drop it in the Tidereel repo — will post here when it's up." },
          ] },
          { author: 'sasha', body: 'The other thing nobody talks about: prefetching. RSC lets you start the DB query before the component tree renders. With Query you are always one tick late. For above-the-fold content that latency matters.' },
        ] },
        { author: 'theo', body: 'Going to cover this in a video this week. The streaming angle is underrated — RSC + Suspense means your shell renders instantly and slots fill in. Query can not do that without a separate skeleton state.', replies: [
          { author: 'imani', body: 'The skeleton state thing is real. We had a whole pattern for it before RSC. Now it is just Suspense and a fallback.' },
        ] },
      ],
    },
    {
      title: 'Hiring: senior React roles across the EU',
      topic: 'jobs',
      conf: reactSummitId,
      createdBy: 'tom',
      posts: [
        { author: 'tom', body: 'I’ve got 6 senior frontend roles open (remote-EU + Amsterdam hybrid). React, TS, design-systems experience valued. DM me or drop a note here.', replies: [
          { author: 'devin', body: 'Not senior yet but following for when I am 👀' },
          { author: 'imani', body: 'Tom, do any of them involve design-system work specifically? Happy to refer people.' },
        ] },
      ],
    },
  ]
  let postCount = 0
  for (const d of discussions) {
    const did = uid()
    await db.insert(discussion).values({
      id: did,
      conferenceId: d.conf ?? null,
      title: d.title,
      topic: d.topic ?? null,
      sessionId: d.session ? S(d.session) : null,
      projectId: null, // resolved below if needed (project ids not tracked in a map here)
      questionId: d.question ? questionIds.get(d.question)! : null,
      createdById: U(d.createdBy),
    })
    const insertPosts = async (posts: Post[], parentId: string | null) => {
      for (const p of posts) {
        const pid = uid()
        await db.insert(discussionPost).values({
          id: pid,
          discussionId: did,
          authorId: U(p.author),
          parentId,
          body: p.body,
        })
        postCount++
        if (p.replies) await insertPosts(p.replies, pid)
      }
    }
    await insertPosts(d.posts, null)
  }
  console.log(`  ✓ ${discussions.length} discussions, ${postCount} posts`)

  /* --- direct messages --- */
  const dms: Array<{ from: string; to: string; body: string; read?: boolean }> = [
    { from: 'noa', to: 'sasha', body: 'Hey! Loved the local-first talk. Could I grab 15 min about using Glasswire for Tidereel?', read: true },
    { from: 'sasha', to: 'noa', body: 'Absolutely — I’m at the OSS booth till 4, or coffee tomorrow morning?', read: true },
    { from: 'noa', to: 'sasha', body: 'Coffee tomorrow is perfect. 9am at the Atrium café?', read: false },
    { from: 'tom', to: 'devin', body: 'Saw you asking great questions in the compiler talk. Not recruiting you (yet!) but let’s stay in touch.', read: true },
    { from: 'priya', to: 'mara', body: 'Your keynote made the server/client boundary finally click for my team. Any chance you’d do an internal talk?', read: false },
    { from: 'jonas', to: 'yuki', body: 'The edge SSR data-locality point hit home. We have the exact problem at DeepL. Mind if I follow up over email?', read: false },
    { from: 'imani', to: 'tom', body: 'Re: your roles — I know two strong design-system engineers looking. Sending intros.', read: true },
  ]
  for (const m of dms) {
    await db.insert(message).values({
      fromUserId: U(m.from),
      toUserId: U(m.to),
      body: m.body,
      readAt: m.read ? new Date() : null,
    })
  }
  console.log(`  ✓ ${dms.length} messages`)

  /* --- connections (the lasting network) --- */
  const connections: Array<{ a: string; b: string; status?: string; note?: string }> = [
    { a: 'noa', b: 'sasha', status: 'accepted', note: 'Met at React Summit — exploring Glasswire for Tidereel.' },
    { a: 'devin', b: 'priya', status: 'accepted', note: 'Same company, finally met in person at the conf.' },
    { a: 'devin', b: 'tom', status: 'accepted', note: 'Recruiter, keep warm for ~1 year.' },
    { a: 'priya', b: 'mara', status: 'pending', note: 'Asked about an internal talk.' },
    { a: 'jonas', b: 'yuki', status: 'pending', note: 'Edge SSR / data locality follow-up.' },
    { a: 'imani', b: 'tom', status: 'accepted' },
    { a: 'theo', b: 'mara', status: 'accepted', note: 'Recording a video about the compiler together.' },
    { a: 'finn', b: 'yuki', status: 'accepted', note: 'WebGPU + edge rendering nerds unite.' },
  ]
  for (const c of connections) {
    await db.insert(connection).values({ userId: U(c.a), contactId: U(c.b), status: c.status ?? 'pending', note: c.note ?? null }).onConflictDoNothing()
    // mirror accepted connections so both sides see them
    if ((c.status ?? 'pending') === 'accepted') {
      await db.insert(connection).values({ userId: U(c.b), contactId: U(c.a), status: 'accepted', note: c.note ?? null }).onConflictDoNothing()
    }
  }
  console.log(`  ✓ ${connections.length} connections`)

  /* --- personal tasks (agent-managed surface) --- */
  const tasks: Array<{ user: string; title: string; done?: boolean; due?: string }> = [
    { user: 'devin', title: 'Audit checkout page for manual memoization after React upgrade', due: `${REACT_SUMMIT_DAY}T20:00` },
    { user: 'devin', title: 'Follow up with Tom (recruiter) in Q4', due: '2025-10-01T09:00' },
    { user: 'devin', title: 'Watch the recording of the testing talk', done: false },
    { user: 'priya', title: 'Spike Rolldown on the design-system repo', due: `${REACT_SUMMIT_DAY}T18:00` },
    { user: 'priya', title: 'Send Mara an internal-talk invite', done: false },
    { user: 'priya', title: 'Share CI war-stories thread with the platform team', done: true },
    { user: 'noa', title: 'Coffee with Sasha — Atrium café 9am', due: `${REACT_SUMMIT_DAY}T09:00` },
    { user: 'noa', title: 'Prototype Tidereel offline mode on Glasswire', done: false },
    { user: 'jonas', title: 'Email Yuki re: edge data locality', done: false },
    { user: 'imani', title: 'Send Tom two design-system engineer intros', done: true },
  ]
  for (const t of tasks) {
    await db.insert(task).values({
      userId: U(t.user),
      title: t.title,
      done: t.done ?? false,
      dueAt: t.due ? new Date(`${t.due}:00+02:00`) : null,
    })
  }
  console.log(`  ✓ ${tasks.length} tasks`)

  console.log('✅ Seed complete.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
