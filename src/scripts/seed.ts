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
  meetup,
  meetupAttendee,
  message,
  moment,
  note,
  profile,
  project,
  projectMember,
  question,
  room,
  sessionResource,
  sessionSpeaker,
  task,
} from '#/db/domain-schema'

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => crypto.randomUUID()

/** Build a Date from a base day + "HH:MM" local-ish offset. */
const at = (day: string, time: string) => new Date(`${day}T${time}:00+02:00`)

const avatar = (key: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(key)}`

const shot = (key: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(key)}/1200/750`

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
  /** Real headshot URL; falls back to a generated avatar when omitted. */
  image?: string
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

  /* --- JSNation Amsterdam 2026 speakers (real lineup) --- */
  {
    key: 'sacha',
    name: 'Sacha Greif',
    email: 'sacha.greif@converge.seed',
    handle: 'sachagreif',
    headline: 'Creator of the State of JS & State of Web Dev AI surveys',
    company: 'Devographics',
    title: 'Founder',
    bio: 'Creator of the State of JS, State of CSS, and State of HTML surveys. I turn what the web community is doing into data.',
    location: 'Japan',
    intents: ['speaking', 'meet community', 'share data'],
    currentFocus: 'The State of Web Dev AI survey',
    interestedTopics: ['ai', 'surveys', 'javascript', 'community'],
    availability: 'open',
    socials: { github: 'sachag', x: 'sachagreif' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1736881262/Sacha-Greif_ygs0wo.png?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'liad',
    name: 'Liad Yosef',
    email: 'liad.yosef@converge.seed',
    handle: 'liadyosef',
    headline: 'Co-author of MCP Apps & MCP-UI; building human-agent interfaces',
    company: 'MCP Apps',
    title: 'Co-founder & CTO, Era Labs',
    bio: 'Co-builder of MCP-UI, co-author and maintainer of MCP Apps on the MCP Steering Committee, and co-creator of GitMCP. Previously AI Lead in Shopify’s CEO office.',
    location: 'Israel',
    intents: ['speaking', 'open standards', 'collaboration'],
    currentFocus: 'The future of human-agent interfaces at Era Labs',
    interestedTopics: ['ai', 'mcp', 'agents', 'open-source'],
    availability: 'open',
    socials: { github: 'liady', x: 'liadyosef', linkedin: 'liadyosef' },
    image: 'https://avatars.githubusercontent.com/u/7003853?v=4',
  },
  {
    key: 'ido',
    name: 'Ido Salomon',
    email: 'ido.salomon@converge.seed',
    handle: 'idosalomon',
    headline: 'Co-creator of MCP-UI & AgentCraft; MCP Steering Committee',
    company: 'MCP Apps',
    title: 'Co-creator, MCP Apps',
    bio: 'Creator of AgentCraft and MCP-UI, co-creator and maintainer of MCP Apps on the MCP Steering Committee. Previously led end-user AI at Palo Alto Networks.',
    location: 'Israel',
    intents: ['speaking', 'open standards', 'meet contributors'],
    currentFocus: 'Human-agent interaction at scale',
    interestedTopics: ['ai', 'mcp', 'agents', 'architecture'],
    availability: 'open',
    socials: { x: 'idosal1', linkedin: 'ido-salomon' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1771237853/profile_nou9cv.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'luca',
    name: 'Luca Mezzalira',
    email: 'luca.mezzalira@converge.seed',
    handle: 'lucamezzalira',
    headline:
      'Author of Building Micro-Frontends; principal solutions architect',
    company: 'Author of Building Micro-Frontends book',
    title: 'Principal Solutions Architect',
    bio: 'Principal solutions architect, international speaker, and O’Reilly author. Twenty years mastering software architectures from frontend to cloud.',
    location: 'UK',
    intents: ['speaking', 'mentoring', 'architecture reviews'],
    currentFocus: 'Helping companies migrate to micro-frontends',
    interestedTopics: ['architecture', 'micro-frontends', 'cloud', 'frontend'],
    availability: 'open',
    socials: {
      github: 'lucamezzalira',
      x: 'lucamezzalira',
      linkedin: 'lucamezzalira',
      site: 'https://lucamezzalira.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1745490391/3IDI5eFx8xI2Xiw1SbHY8t8hiWgC%402BDN0STSJRMMV6FY%403D.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'noah',
    name: 'Noah Yamamoto',
    email: 'noah.yamamoto@converge.seed',
    handle: 'noahyamamoto',
    headline: 'Frontend engineer building WhatsApp’s design system',
    company: 'Meta',
    title: 'Frontend Engineer',
    bio: 'Frontend developer at Meta focused on performant, satisfying UX. Recently moved to London to build an AI-powered design system for WhatsApp.',
    location: 'UK',
    intents: ['speaking', 'design systems', 'meet people'],
    currentFocus: 'A design system for 1B+ WhatsApp users',
    interestedTopics: ['design-systems', 'frontend', 'ai', 'ux'],
    availability: 'open',
    socials: {
      github: 'Egrodo',
      linkedin: '~noah',
      site: 'https://noahyamamoto.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1770900416/u%402BmVlZxHvW12FLwbCBfz%402B%402BJkDpzb9Y3GxnZNdUeQUjE%403D.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'paolo',
    name: 'Paolo Ricciuti',
    email: 'paolo.ricciuti@converge.seed',
    handle: 'paoloricciuti',
    headline: 'Svelte Ambassador & Maintainer; co-creator of SvelteLab',
    company: 'Mainmatter',
    title: 'Senior Software Engineer',
    bio: 'Svelte Ambassador and Maintainer, sometimes called a mad scientist for weird JavaScript experiments. Co-creator of SvelteLab.',
    location: 'Italy',
    intents: ['speaking', 'open-source', 'teaching'],
    currentFocus: 'The official Svelte MCP server',
    interestedTopics: ['svelte', 'ai', 'mcp', 'javascript'],
    availability: 'open',
    socials: {
      github: 'paoloricciuti',
      x: 'PaoloRicciuti',
      site: 'https://ricciuti.me',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1750147359/BfrBIi7ajx7pHOH3NCpWwrhMwgX7Uzk8dS6x%402FIW8J8k%403D.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'joyee',
    name: 'Joyee Cheung',
    email: 'joyee.cheung@converge.seed',
    handle: 'joyeecheung',
    headline: 'V8 committer & Node.js TSC member',
    company: 'Igalia',
    title: 'Software Engineer',
    bio: 'Software engineer at Igalia tinkering with V8/Node.js to improve developer experience, stability and performance. V8 committer and member of the Node.js TSC.',
    location: 'Spain',
    intents: ['speaking', 'meet contributors', 'standards'],
    currentFocus: 'Improving the ESM pipeline in Node.js',
    interestedTopics: ['nodejs', 'v8', 'esm', 'performance'],
    availability: 'open',
    socials: {
      github: 'joyeecheung',
      x: 'JoyeeCheung',
      site: 'https://joyeecheung.github.io/blog',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1673878851/dev/Cheung_Joyee_gdegde.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'alem',
    name: 'Alem Tuzlak',
    email: 'alem.tuzlak@converge.seed',
    handle: 'alemtuzlak',
    headline: 'TanStack maintainer; building TanStack AI & Devtools',
    company: 'Code Forge',
    title: 'Founder',
    bio: 'Software engineer and founder of Code Forge. Builds open-source tooling in the TanStack ecosystem, best known for TanStack AI and TanStack Devtools.',
    location: 'Bosnia and Herzegovina',
    intents: ['speaking', 'open-source', 'teaching'],
    currentFocus: 'TanStack AI',
    interestedTopics: ['ai', 'tanstack', 'react', 'devtools'],
    availability: 'open',
    socials: { github: 'AlemTuzlak' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1768991063/Alem_Tuzlak_mcudbo.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'eddie',
    name: 'Eddie Jaoude',
    email: 'eddie.jaoude@converge.seed',
    handle: 'eddiejaoude',
    headline: 'Fullstack developer & open-source educator',
    company: 'PayPal',
    title: 'Engineer',
    bio: 'Fullstack developer with 15+ years across UK government, banks, fintechs and startups. Creates technical content on JS/TS, databases, DevOps, testing and AI.',
    location: 'UK',
    intents: ['speaking', 'teaching', 'fun'],
    currentFocus: 'Realtime multiplayer web demos',
    interestedTopics: ['realtime', 'ai', 'nextjs', 'open-source'],
    availability: 'open',
    socials: {
      github: 'eddiejaoude',
      x: 'eddiejaoude',
      site: 'https://eddiejaoude.substack.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1776888614/DSC08784_csszvi.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'tobias',
    name: 'Tobias Koppers',
    email: 'tobias.koppers@converge.seed',
    handle: 'tobiaskoppers',
    headline: 'Creator of webpack & Turbopack',
    company: 'Vercel',
    title: 'Software Engineer',
    bio: 'Creator of webpack and Turbopack. Father of two children. Likes to play board games.',
    location: 'Germany',
    intents: ['speaking', 'tooling', 'meet people'],
    currentFocus: 'Turbopack chunking and performance',
    interestedTopics: ['tooling', 'bundlers', 'performance', 'rust'],
    availability: 'open',
    socials: { github: 'sokra', x: 'wSokra' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1688661022/tobias_photo_jwodam.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'wesbos',
    name: 'Wes Bos',
    email: 'wes.bos@converge.seed',
    handle: 'wesbos',
    headline: 'Fullstack developer, teacher & Syntax.fm co-host',
    company: 'Syntax.fm',
    title: 'Developer & Educator',
    bio: 'Fullstack developer from Canada and co-host of the Syntax.fm podcast. Has taught over half a million people JavaScript.',
    location: 'Canada',
    intents: ['speaking', 'teaching', 'fun'],
    currentFocus: 'Agentic interfaces and the future of UI',
    interestedTopics: ['ai', 'javascript', 'web-mcp', 'dx'],
    availability: 'open',
    socials: { x: 'wesbos', site: 'https://wesbos.com' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1670334021/dev/Wes_Bos_hib0hw.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },

  /* --- React Summit Amsterdam 2026 speakers (real lineup) --- */
  {
    key: 'aurora',
    name: 'Aurora Scharff',
    email: 'aurora.scharff@converge.seed',
    handle: 'aurorascharff',
    headline: 'DX Engineer at Vercel; React Certification Lead',
    company: 'Vercel',
    title: 'DX Engineer',
    bio: 'DX Engineer at Vercel and React Certification Lead at certificates.dev. Specializes in education and community around React and Next.js, building learning resources and speaking worldwide.',
    location: 'Norway',
    intents: ['speaking', 'teaching', 'meet community'],
    currentFocus: 'What React Server Components can do in Next.js today',
    interestedTopics: ['react', 'nextjs', 'rsc', 'dx'],
    availability: 'open',
    socials: {
      github: 'aurorascharff',
      x: 'aurorascharff',
      linkedin: 'aurora-scharff-a86b88188',
      site: 'https://aurorascharff.no',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1776259207/main_small_bwdhao.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'scott',
    name: 'Scott Tolinski',
    email: 'scott.tolinski@converge.seed',
    handle: 'stolinski',
    headline: 'Co-host of Syntax.fm; founder of Level Up Tutorials',
    company: 'Syntax.fm',
    title: 'Educator & Podcaster',
    bio: 'Makes web-dev video tutorials at Level Up Tutorials and co-hosts the Syntax.fm podcast with Wes Bos. Breakdancer of 15+ years.',
    location: 'USA',
    intents: ['speaking', 'teaching', 'fun'],
    currentFocus: 'Replacing hand-built React with the web platform',
    interestedTopics: ['web-platform', 'react', 'css', 'dx'],
    availability: 'open',
    socials: { x: 'stolinski', site: 'https://tolin.ski' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1695990321/Scott_Tolinski_k2z2ys.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'manuel',
    name: 'Manuel Schiller',
    email: 'manuel.schiller@converge.seed',
    handle: 'schanuelmiller',
    headline: 'Core contributor to TanStack Router & TanStack Start',
    company: 'TanStack',
    title: 'Full-stack Engineer',
    bio: 'Full-stack software engineer and TypeScript specialist, and a core contributor to TanStack Router and TanStack Start.',
    location: 'Germany',
    intents: ['speaking', 'open-source', 'meet contributors'],
    currentFocus: 'RSC as data in TanStack Start',
    interestedTopics: ['tanstack', 'rsc', 'typescript', 'react'],
    availability: 'open',
    socials: { github: 'schiller-manuel', x: 'schanuelmiller' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1775141601/unnamed_8_i5w6q0.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'mark',
    name: 'Mark Erikson',
    email: 'mark.erikson@converge.seed',
    handle: 'acemarke',
    headline: 'Redux maintainer & creator of Redux Toolkit',
    company: 'Replay.io',
    title: 'Senior Front-End Engineer',
    bio: 'Senior front-end engineer at Replay. Redux maintainer, creator of Redux Toolkit, and keeper of the Redux docs. Answers React/Redux questions anywhere there is a comment box.',
    location: 'USA',
    intents: ['speaking', 'teaching', 'meet community'],
    currentFocus: 'Demystifying how the React Compiler renders',
    interestedTopics: ['react', 'redux', 'compilers', 'performance'],
    availability: 'open',
    socials: {
      github: 'markerikson',
      x: 'acemarke',
      site: 'https://blog.isquaredsoftware.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1647589299/c7hrlxamsxzlkrh2rn7p.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'adrian',
    name: 'Adrian Hajdin',
    email: 'adrian.hajdin@converge.seed',
    handle: 'jsmasterypro',
    headline: 'Founder of the JavaScript Mastery YouTube channel',
    company: 'JS Mastery',
    title: 'Educator & GitHub Star',
    bio: 'Software engineer, educator, and GitHub Star. Started JavaScript Mastery, one of the largest technical-education YouTube channels for intermediate-to-advanced JS developers.',
    location: 'Croatia',
    intents: ['speaking', 'teaching', 'meet community'],
    currentFocus: 'Using AI as a teaching layer in development',
    interestedTopics: ['ai', 'education', 'javascript', 'react'],
    availability: 'open',
    socials: {
      github: 'adrianhajdin',
      x: 'jsmasterypro',
      site: 'https://jsmastery.pro',
    },
    image: 'https://avatars.githubusercontent.com/u/24898559?v=4',
  },
  {
    key: 'faris',
    name: 'Faris Aziz',
    email: 'faris.aziz@converge.seed',
    handle: 'farisaziz12',
    headline: 'Staff Frontend Engineer; resilient web architecture',
    company: 'Smallpdf',
    title: 'Staff Frontend Engineer',
    bio: 'Staff Frontend Engineer specializing in React, Next.js, monetization systems, and resilient web architecture. Co-organizes ZurichJS and contributes to tools like Raycast.',
    location: 'Switzerland',
    intents: ['speaking', 'mentoring', 'meet people'],
    currentFocus: 'Designing frontends for failure: SLOs, flags, rollbacks',
    interestedTopics: ['react', 'reliability', 'observability', 'architecture'],
    availability: 'open',
    socials: {
      github: 'farisaziz12',
      x: 'farisaziz12',
      linkedin: 'farisaziz12',
      site: 'https://faziz-dev.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1745961492/Sm%402BZ%402BeLAAqqWxkDSHG6wr8mmnOKdnFldEl1GDY2yxp4%403D.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'alexrussell',
    name: 'Alex Russell',
    email: 'alex.russell@converge.seed',
    handle: 'alexrussell',
    headline: 'Partner PM for Edge; key contributor to ES6 & Service Workers',
    company: 'Microsoft',
    title: 'Partner Program Manager, Edge',
    bio: 'Partner PM on the Microsoft Edge team and Blink API owner. Previously a dozen years on Chrome’s Web Platform team — Project Fugu, PWAs, Service Workers, Web Components, and ES6 features like Classes and Promises. Plays for Team Web.',
    location: 'USA',
    intents: ['speaking', 'standards', 'platform strategy'],
    currentFocus: 'Building bridges to a post-SPA future',
    interestedTopics: [
      'performance',
      'web-platform',
      'standards',
      'architecture',
    ],
    availability: 'open',
    socials: { linkedin: 'alexrussell' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1733830763/Alex_Russell_500px_squooshed_jmf3n1.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'alexgs',
    name: 'Alex Garrett-Smith',
    email: 'alex.garrettsmith@converge.seed',
    handle: 'alexdotgs',
    headline: 'Full-stack engineer & Tech Education Lead at BitterBrains',
    company: 'BitterBrains',
    title: 'Tech Education Lead',
    bio: 'Full-stack software engineer, founder with a successful exit, and Tech Education Lead at BitterBrains.',
    location: 'UK',
    intents: ['speaking', 'teaching', 'meet people'],
    currentFocus: 'Spec-driven development with AI',
    interestedTopics: ['ai', 'dx', 'future-of-dev', 'javascript'],
    availability: 'open',
    socials: {
      x: 'alexdotgs',
      linkedin: 'alexgarrettsmith',
      site: 'https://alex.gs',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1778680191/95B3C87F-FE21-416E-ACFB-B8309113C707_2_bsu9me.png?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'gaauwe',
    name: 'Gaauwe Rombouts',
    email: 'gaauwe.rombouts@converge.seed',
    handle: 'gaauwe',
    headline: 'Frontend Engineer at Zed',
    company: 'Zed',
    title: 'Frontend Engineer',
    bio: 'Frontend Engineer at Zed, building the web experience around a code editor made for speed and AI collaboration. One of the few TypeScript developers in a Rust shop.',
    location: 'Netherlands',
    intents: ['speaking', 'meet people', 'tooling'],
    currentFocus: 'Balancing speed, quality, and AI at Zed',
    interestedTopics: ['performance', 'ai', 'tooling', 'typescript'],
    availability: 'open',
    socials: { github: 'gaauwe', site: 'https://gaauwe.nl' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1775138880/IMG_0170_1_mr78w2.png?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'kitze',
    name: 'Kitze',
    email: 'kitze@converge.seed',
    handle: 'thekitze',
    headline: 'Founder of Sizzy & React Academy',
    company: 'React Academy',
    title: 'Founder & Educator',
    bio: 'Loves to rant about web dev. Founder of Sizzy (the browser for developers) and React Academy, creator of Zero To Shipped. Documents his journey on YouTube and Twitch.',
    location: 'Poland',
    intents: ['speaking', 'teaching', 'fun'],
    currentFocus: 'From vibe coding to vibe engineering',
    interestedTopics: ['ai', 'react', 'dx', 'tooling'],
    availability: 'open',
    socials: { github: 'kitze', x: 'thekitze' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1687197752/kitze_dijey7.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'kathryn',
    name: 'Kathryn Grayson Nanz',
    email: 'kathryn.nanz@converge.seed',
    handle: 'kathryngrayson',
    headline: 'Developer Advocate; designer-turned-developer',
    company: 'Progress Software',
    title: 'Developer Advocate',
    bio: 'Developer advocate who helps people build React web apps, design and maintain UI component libraries, and stops back-end devs from writing more CSS. Started as a graphic designer.',
    location: 'USA',
    intents: ['speaking', 'meet community', 'design systems'],
    currentFocus: 'React UI component libraries and design',
    interestedTopics: ['react', 'design-systems', 'css', 'dx'],
    availability: 'open',
    socials: {
      github: 'kathryngraysonnanz',
      x: 'kathryngrayson',
      site: 'https://kgrayson.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1635191787/jhlzdo2xk9zfgyrrsnzr.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'kevin',
    name: 'Kevin Ball',
    email: 'kevin.ball@converge.seed',
    handle: 'kbal11',
    headline: 'VP of Engineering at Mento; JSParty panelist',
    company: 'Mento',
    title: 'VP of Engineering',
    bio: 'VP of engineering at Mento and a trained coach for engineers and engineering managers. JSParty panelist, founder of the San Diego JavaScript Meetup, and writer on human skills in tech.',
    location: 'USA',
    intents: ['speaking', 'mentoring', 'meet people'],
    currentFocus: 'Helping engineers grow their careers',
    interestedTopics: ['leadership', 'javascript', 'career', 'community'],
    availability: 'open',
    socials: { github: 'kball', x: 'kbal11', linkedin: 'kbal11' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1695039554/kball-headshot-cropped_mbegy6.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'sam',
    name: 'Sam Selikoff',
    email: 'sam.selikoff@converge.seed',
    handle: 'samselikoff',
    headline: 'Software engineer on the Next.js team',
    company: 'Vercel',
    title: 'Software Engineer',
    bio: 'Software engineer on the Next.js team at Vercel. Taught frontend for over eight years through trainings, conference talks, and videos on Egghead, YouTube, and Build UI.',
    location: 'USA',
    intents: ['speaking', 'teaching', 'meet community'],
    currentFocus: 'Next.js and frontend education',
    interestedTopics: ['react', 'nextjs', 'dx', 'animation'],
    availability: 'open',
    socials: {
      github: 'samselikoff',
      x: 'samselikoff',
      site: 'https://samselikoff.com',
    },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1761563186/Sam_Selikoff_vyuqpf.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
  {
    key: 'ryan',
    name: 'Ryan Skinner',
    email: 'ryan.skinner@converge.seed',
    handle: 'skiniks',
    headline: 'Creator of rari, an RSC framework on a Rust runtime',
    company: 'Rari',
    title: 'Founder',
    bio: 'Building for the web for 25 years. Created rari, a React Server Components framework on a Rust runtime delivering far higher throughput and faster responses than Next.js. Believes performance shouldn’t be an afterthought.',
    location: 'Canada',
    intents: ['speaking', 'open-source', 'meet people'],
    currentFocus: 'rari — RSC on a Rust runtime',
    interestedTopics: ['rsc', 'rust', 'performance', 'frameworks'],
    availability: 'open',
    socials: { github: 'skiniks', site: 'https://ryanskinner.com' },
    image:
      'https://gitnation.imgix.net/stichting-frontend-amsterdam/image/upload/v1771504309/LUVE1534_j1fp27.jpg?auto=format,compress&fit=crop&w=300&h=300',
  },
]

/* ------------------------------------------------------------------ */
/* Conferences                                                        */
/* ------------------------------------------------------------------ */

// JSNation runs Thursday; React Summit is the next day (today).
const JSNATION_DAY = '2026-06-11'
const REACT_SUMMIT_DAY = '2026-06-12'

/* ------------------------------------------------------------------ */
/* Seed                                                               */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log('🌱 Seeding Converge…')

  // Clean slate (cascade clears all domain rows referencing users/conferences).
  await db.execute(sql`
    truncate table
      ${task}, ${connection}, ${message}, ${meetupAttendee}, ${meetup},
      ${discussionPost}, ${discussion}, ${answer}, ${question}, ${note},
      ${moment}, ${sessionResource}, ${sessionSpeaker}, ${conferenceSession},
      ${room},
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
      image: p.image ?? avatar(p.handle),
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
      slug: 'jsnation-amsterdam-2026',
      name: 'JSNation Amsterdam 2026',
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
      slug: 'react-summit-amsterdam-2026',
      name: 'React Summit Amsterdam 2026',
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
    {
      id: rooms.jsMain,
      conferenceId: jsnationId,
      name: 'Forum Hall',
      floor: 'Ground',
      capacity: 1600,
      location: { lat: 52.341, lng: 4.889 },
    },
    {
      id: rooms.jsAtrium,
      conferenceId: jsnationId,
      name: 'Atrium Stage',
      floor: '1',
      capacity: 400,
      location: { lat: 52.3412, lng: 4.8895 },
    },
    {
      id: rooms.rsMain,
      conferenceId: reactSummitId,
      name: 'Forum Hall',
      floor: 'Ground',
      capacity: 1600,
      location: { lat: 52.341, lng: 4.889 },
    },
    {
      id: rooms.rsCommunity,
      conferenceId: reactSummitId,
      name: 'Community Stage',
      floor: '1',
      capacity: 500,
      location: { lat: 52.3413, lng: 4.8898 },
    },
    {
      id: rooms.rsWorkshop,
      conferenceId: reactSummitId,
      name: 'Workshop Room E',
      floor: '2',
      capacity: 80,
    },
  ])
  console.log('  ✓ 2 conferences, 5 rooms')

  /* --- conference membership + roles --- */
  type Membership = [conf: string, role: string, keys: string[]]
  const memberships: Membership[] = [
    // JSNation
    [jsnationId, 'organizer', ['elena']],
    [
      jsnationId,
      'speaker',
      [
        'sacha',
        'liad',
        'ido',
        'luca',
        'noah',
        'paolo',
        'joyee',
        'alem',
        'eddie',
        'tobias',
        'wesbos',
      ],
    ],
    [jsnationId, 'sponsor', ['tom']],
    [
      jsnationId,
      'attendee',
      [
        'mara',
        'devin',
        'priya',
        'noa',
        'jonas',
        'yuki',
        'aisha',
        'lukas',
        'sven',
        'theo',
      ],
    ],
    // React Summit (co-located, same day)
    [reactSummitId, 'organizer', ['elena']],
    [
      reactSummitId,
      'speaker',
      [
        'aurora',
        'scott',
        'manuel',
        'mark',
        'adrian',
        'faris',
        'alexrussell',
        'alexgs',
        'gaauwe',
        'kitze',
        'kathryn',
        'kevin',
        'sam',
        'ryan',
        'alem',
      ],
    ],
    [reactSummitId, 'sponsor', ['tom']],
    [
      reactSummitId,
      'attendee',
      [
        'theo',
        'imani',
        'devin',
        'priya',
        'noa',
        'jonas',
        'lukas',
        'mara',
        'sasha',
        'yuki',
        'grace',
        'aisha',
        'finn',
      ],
    ],
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
      members: [
        ['mara', 'advisor'],
        ['yuki', 'contributor'],
      ],
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
    await db
      .insert(projectMember)
      .values({ projectId: id, userId: U(pr.owner), role: 'owner' })
      .onConflictDoNothing()
    for (const [k, role] of pr.members ?? []) {
      await db
        .insert(projectMember)
        .values({ projectId: id, userId: U(k), role })
        .onConflictDoNothing()
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
  const day = (conf: string) =>
    conf === jsnationId ? JSNATION_DAY : REACT_SUMMIT_DAY

  const sessions: SessionSeed[] = [
    // --- JSNation Amsterdam 2026 — JSNation Track (single track, Forum Hall) ---
    // Times are Europe/Amsterdam local (the `at` helper anchors them to +02:00).
    {
      key: 'js-opening',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Opening Ceremony',
      abstract:
        'Kick off JSNation Amsterdam 2026 — what to expect across the day, the people to meet, and the housekeeping before the talks begin.',
      track: 'Ceremony',
      start: '09:10',
      end: '09:30',
      speakers: ['elena'],
    },
    {
      key: 'js-state-ai',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'The State of AI for Web Development',
      abstract:
        "A look through the main trends revealed by this year's State of Web Dev AI survey results, based on data collected from over 6800 developers.",
      track: 'AI',
      start: '09:30',
      end: '10:00',
      speakers: ['sacha'],
      aiSummary:
        'Adoption is broad but shallow — most devs use AI for autocomplete and boilerplate, far fewer for architecture. Trust, not capability, is the current ceiling.',
    },
    {
      key: 'js-mcp-apps',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'MCP Apps – the Next Web',
      abstract:
        'MCP Apps are the last piece in moving toward a new, nearly headless web. Agents interact with most sites through MCP and APIs, but some moments still need human eyes — choosing a seat, completing a check-in, verifying intent. MCP Apps let tools send composable, interactive UI directly to agents, exactly when needed.',
      track: 'AI',
      start: '10:15',
      end: '10:45',
      speakers: ['liad', 'ido'],
      aiSummary:
        'The web is going headless-with-a-human-eye: agents drive, but tools push interactive UI chunks for the last mile. MCP Apps standardize that UI layer.',
    },
    {
      key: 'js-microfrontends',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Designing a Migration to Micro-Frontends',
      abstract:
        'Migrating to a micro-frontend architecture promises scalability, faster development cycles, and autonomous teams — but the journey is rarely straightforward. Practical lessons, challenges, and trade-offs from modernising hundreds of companies.',
      track: 'Architecture',
      start: '10:50',
      end: '11:20',
      speakers: ['luca'],
      aiSummary:
        'Define clear boundaries first, evolve incrementally, and treat inter-team dependencies as the real cost. Most failed migrations are org problems, not tech problems.',
    },
    {
      key: 'js-design-system',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Creating a Design System for 1B+ Users in the Age of AI',
      abstract:
        'For 11 years the WhatsApp Web platform served a billion people with no consistent design system. The story of selling, building, and migrating one into a 1M+ LoC frontend — and how the project was both boosted by AI and benefits AI productivity.',
      track: 'Design Systems',
      start: '11:50',
      end: '12:20',
      speakers: ['noah'],
      aiSummary:
        'A design system at this scale is a migration problem, not a component problem. AI accelerates both the build and the long tail of adoption across teams.',
    },
    {
      key: 'js-svelte-llm',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'How I Taught LLMs How to Svelte',
      abstract:
        "LLMs are changing how we write code, but they degrade fast outside their training set. Releasing Svelte 5 with a big syntax rewrite right as LLMs got good at code was unfortunate — here's how an MCP server adds context and guides models to write perfect Svelte 5 runes and reactivity.",
      track: 'Svelte',
      start: '12:25',
      end: '12:55',
      speakers: ['paolo'],
      aiSummary:
        'New framework syntax falls outside model training data; an MCP server that injects current docs and examples closes the gap better than fine-tuning.',
    },
    {
      key: 'js-esm-node',
      conf: jsnationId,
      room: rooms.jsMain,
      title: "Life of an ESM in Node.js – and How It's Changing for the Better",
      abstract:
        'What actually happens when Node.js loads an ES module: resolution, loading, parsing, compilation, linking, instantiation, and evaluation. Where the work splits between V8 and Node.js, how it differs from browsers and bundlers, and recent changes that unlock better interop and performance.',
      track: 'Node.js',
      start: '13:00',
      end: '13:30',
      speakers: ['joyee'],
      aiSummary:
        'The ESM loader does far more before your code runs than most assume. Recent Node changes improve interop and let you customize resolution without hacks.',
    },
    {
      key: 'js-tanstack-ai',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'How We Used AI to Build TanStack AI',
      abstract:
        'TanStack AI is an open-source project that makes it easy to use AI in your apps. How the team used AI to prototype concepts, solidify APIs, and ship the final library in under a month — with practical, repeatable use-cases for AI in your day to day.',
      track: 'AI',
      start: '14:30',
      end: '15:00',
      speakers: ['alem'],
      aiSummary:
        'AI is strongest at prototyping and API exploration, weakest at the last 20% of correctness. Ship faster by letting it draft and keeping humans on the seams.',
    },
    {
      key: 'js-stress-test',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Stress Test Your Reflexes (And My App)',
      abstract:
        'What happens when you turn the audience into a live, distributed load test? A high-stakes multiplayer Whack-a-Mole played from your phone generates a stream of concurrent data — then we dig into the architecture, the realtime stack, and how helpful (or distracting) AI was building it.',
      track: 'Fun Demos',
      start: '15:05',
      end: '15:35',
      speakers: ['eddie'],
    },
    {
      key: 'js-awards',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'JavaScript OS Awards Ceremony',
      abstract:
        'Celebrating the open-source projects and maintainers that kept the JavaScript ecosystem moving this year.',
      track: 'Ceremony',
      start: '15:40',
      end: '16:10',
      speakers: ['elena'],
    },
    {
      key: 'js-chunking',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Chunking',
      abstract:
        'How bundlers place modules into output files — the competing metrics chunking influences, why CSS and JS chunking are completely different, performance considerations for large apps, and how JS/CSS chunking works in webpack, Turbopack, and Next.js.',
      track: 'Tooling',
      start: '16:30',
      end: '17:00',
      speakers: ['tobias'],
      aiSummary:
        'Chunking is a balance between request count, cache hit-rate, and initial payload. CSS and JS pull in opposite directions; the bundler defaults are rarely optimal for large apps.',
    },
    {
      key: 'js-lightning',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Lightning Talks',
      abstract:
        'Four fast talks: A Brief History of Code Review (Santosh Yadav), Rustifying Vite: Designing a Hybrid Toolchain for the Real World (Alexander Lichter), Debugging Performance With AI (Bernie Sumption), and Taste in Software Development (Steven Hao).',
      track: 'Lightning',
      start: '17:05',
      end: '17:35',
      speakers: ['elena'],
    },
    {
      key: 'js-agentic',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Agentic Interfaces: Tools, Skills, Generative UI and Web MCP',
      abstract:
        'Who is ordering Starbucks with ChatGPT? Will an agent just make the perfect UI for you? Do we even need websites anymore? A look at the current landscape of agentic interfaces and the future of UI, websites, and browsers — do we add AI to our site, or does our site get added to AI?',
      track: 'AI',
      start: '17:40',
      end: '18:10',
      speakers: ['wesbos'],
      aiSummary:
        'Sites will be consumed by agents as much as by people. Web MCP + generative UI is the bet: expose capabilities as tools, let the agent compose the interface.',
    },
    {
      key: 'js-closing',
      conf: jsnationId,
      room: rooms.jsMain,
      title: 'Closing Ceremony',
      abstract:
        'Wrapping up JSNation Amsterdam 2026 — thank-yous, the highlights, and where the conversations continue.',
      track: 'Ceremony',
      start: '18:10',
      end: '18:20',
      speakers: ['elena'],
    },

    // --- React Summit Amsterdam 2026 — Summit Track (single track, Forum Hall) ---
    // The day after JSNation; times are Europe/Amsterdam local.
    {
      key: 'rs-opening',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'Opening Ceremony',
      abstract:
        'Welcome to React Summit Amsterdam 2026 — the shape of the day, the people to find, and what is new this year.',
      track: 'Ceremony',
      start: '09:10',
      end: '09:30',
      speakers: ['elena'],
    },
    {
      key: 'rs-rsc-next',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'What RSCs Can Do in Next.js Today',
      abstract:
        'Building app-like UX once meant reaching for an SPA — shipping the data layer to the browser, juggling a client cache and loading states. Next.js takes a different path: each piece of your app runs where it belongs while the mental model stays the same — components. See how that translates into instant-feeling, streamed UI, fresh data, caching across the stack, and Core Web Vitals that hold up as you scale.',
      track: 'React Server Components',
      start: '09:30',
      end: '10:00',
      speakers: ['aurora'],
      aiSummary:
        'RSC in Next.js lets you keep the component model while moving work to where it belongs. The payoff is streamed UI, fresh data, and strong Core Web Vitals without SPA boilerplate.',
      // React Summit main-stage livestream on YouTube.
      livestreamUrl: 'https://www.youtube.com/watch?v=C0dnfm48K4Q',
    },
    {
      key: 'rs-platform',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'This Component Could Have Been A Class',
      abstract:
        'The web platform is not what it was in 2013, yet many of us still construct every UI element from scratch in React. Scott explores platform advancements — dialog, popover, details/summary and more — that can greatly simplify your React components while making them more accessible.',
      track: 'Web Platform',
      start: '10:10',
      end: '10:40',
      speakers: ['scott'],
      aiSummary:
        'Reach for native elements (dialog, popover, details) before hand-building. They cut code and are accessible by default — let the platform do the work.',
    },
    {
      key: 'rs-rsc',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'Tanstack Start and How It Supports React Server Components',
      abstract:
        'Most RSC implementations make components feel like a fixed, server-owned tree. TanStack Start treats RSC as data — server-rendered fragments the client can fetch, cache, and compose into its own UI tree. Because RSC fit the same caching story as data, they use TanStack Router’s cache, TanStack Query, or others directly, enabling fine-grained caching and invalidation, and composing cleanly with middleware and different rendering strategies.',
      track: 'React Server Components',
      start: '10:45',
      end: '11:15',
      speakers: ['manuel'],
      aiSummary:
        'Treat RSC as data, not a fixed server tree: fetch, cache, and compose it with the same tools you already use for queries. No separate caching model just for components.',
    },
    {
      key: 'rs-compiler',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'A Guide to React Compiler Rendering',
      abstract:
        'The React Compiler promises to “automatically optimize your React app” — but what is it actually doing to your component, and how does that make your app faster? We clear up the confusion around when, why, and how React renders, demystify the compiler’s output, and show how it rewrites our mental model of using React.',
      track: 'React Internals',
      start: '11:45',
      end: '12:15',
      speakers: ['mark'],
      aiSummary:
        'The compiler auto-memoizes at build time; bailouts happen on mutation and dynamic access. Keep components pure and the compiler does the rest. Delete most useMemo.',
    },
    {
      key: 'rs-ai-educator',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'How I use AI as a Technical Educator',
      abstract:
        'Over the past year, building applications has changed dramatically — projects that took weeks now take days. But the bigger shift is in how we learn and teach. Adrian shares using AI not just as a coding assistant but as a teaching layer: exploring architectures, validating decisions, iterating faster, and the growing gap between fast “vibe coding” and real understanding.',
      track: 'AI',
      start: '12:20',
      end: '12:50',
      speakers: ['adrian'],
      aiSummary:
        'Use AI as a teaching layer, not just autocomplete: explore architectures and validate decisions out loud. Beware the gap between vibe-coding speed and real understanding.',
    },
    {
      key: 'rs-failure',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: "Designing for Failure: The Senior React Dev's Production Toolkit",
      abstract:
        'You can be a strong frontend engineer while staying oblivious to availability, SLAs, SLOs, and delivery metrics — until you want more impact. This talk expands the frontend perspective to the system it lives in: resilience as a mindset, and how atomic changes, trunk-based development, feature flags, and automated rollbacks affect frontend work, tied to availability targets, SLOs, and DORA metrics.',
      track: 'Best Practices',
      start: '12:55',
      end: '13:25',
      speakers: ['faris'],
      aiSummary:
        'Resilience is a frontend concern. Atomic changes, feature flags, and automated rollbacks tied to SLOs turn a bad deploy into a non-event.',
    },
    {
      key: 'rs-post-spa',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'Building Bridges to a Post-SPA Future',
      abstract:
        'SPAs were always based on contingent logic: the benefits only materialise when users spend a lot of time in one interface, updating state in place — which never described most experiences. As the industry moves away from SPAs, the largest hurdle is organisational: retaining the trust of managers who signed off on the SPAs that now feel slow. This talk covers the evidence and approaches that build senior-leader confidence in the new analysis.',
      track: 'Performance',
      start: '14:25',
      end: '14:55',
      speakers: ['alexrussell'],
      aiSummary:
        'Most journeys never persisted state across screens — the SPA tax was rarely worth it. Moving past SPAs is as much an organisational journey (manager trust) as a technical one.',
    },
    {
      key: 'rs-specs',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'We Need More Than Prompts',
      abstract:
        'Coding with an agent tends to settle into the same loop: prompt, check, re-prompt, repeat — burning time and tokens. There’s a better way, and it starts before any code is written. This talk puts the prompt-and-iterate loop head to head with spec-driven development, showing what a spec gives you that prompting can’t: decisions you can review before code exists, and context your whole team can build on.',
      track: 'Future of Development',
      start: '15:00',
      end: '15:30',
      speakers: ['alexgs'],
      aiSummary:
        'Spec-driven development beats prompt-and-iterate: a spec captures reviewable decisions before any code exists and gives the whole team shared context.',
    },
    {
      key: 'rs-lightning',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'Lightning Talks',
      abstract:
        "Four fast talks: I Did Everything Wrong So You Don't Have To (Angel Pichardo), Taming the Flicker: Firebase Patterns for React Server Components (Rosario Fernandes), Framework Native Rendering Without Code Duplication? (Stephen Cooper), and CLI, GUI, or Just Blind Trust? A Tour of Code Review Styles (Santosh Yadav).",
      track: 'Lightning',
      start: '15:35',
      end: '16:05',
      speakers: ['elena'],
    },
    {
      key: 'rs-panel',
      conf: reactSummitId,
      room: rooms.rsMain,
      title:
        'Panel Discussion: Fullstack is Eating Frontend — Should FE Engineers Adapt?',
      abstract:
        'A panel on whether the move toward fullstack should change how frontend engineers work — and where the craft of the frontend still matters.',
      track: 'Panel',
      start: '16:25',
      end: '17:00',
      speakers: ['kathryn', 'kevin', 'scott', 'sam', 'alem', 'ryan'],
    },
    {
      key: 'rs-quality-ai',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: "Speed, Quality, and AI: You Can't Have It All (Or Can You?)",
      abstract:
        'Every team building with AI faces the same tension: move fast and ship, or slow down and get it right. At Zed — an IDE obsessed with performance and quality — that means being brutally honest about where AI helps, where it hurts, and how to decide when the answer isn’t obvious. The tradeoffs, the mistakes, and the framework for keeping quality alive when speed is the default.',
      track: 'Performance',
      start: '17:05',
      end: '17:35',
      speakers: ['gaauwe'],
      aiSummary:
        'Be brutally honest about where AI helps and where it hurts. Quality survives the speed default only with an explicit framework for the tradeoffs.',
    },
    {
      key: 'rs-vibe',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'From Vibe Coding to Vibe Engineering',
      abstract:
        'Web development moves in cycles of hype, from frameworks to tooling. With large language models we’re entering an era of “vibe coding,” where developers shape software through collaboration with AI rather than syntax. What does that mean for the future of coding — especially frontend — and how does it echo the past while redefining what comes next?',
      track: 'AI',
      start: '17:40',
      end: '18:10',
      speakers: ['kitze'],
      aiSummary:
        'Vibe coding shifts the craft from syntax to collaboration with AI. The cycle echoes past framework hype — the discipline (“vibe engineering”) is what makes it stick.',
    },
    {
      key: 'rs-closing',
      conf: reactSummitId,
      room: rooms.rsMain,
      title: 'Closing Ceremony',
      abstract:
        'Closing out React Summit Amsterdam 2026 — the highlights, the thank-yous, and where the after-hours conversations continue.',
      track: 'Ceremony',
      start: '18:10',
      end: '18:20',
      speakers: ['elena'],
    },
  ]

  const sessionIds = new Map<string, string>()
  for (const s of sessions) {
    const id = uid()
    sessionIds.set(s.key, id)
    await db.insert(conferenceSession).values({
      id,
      slug: s.key,
      conferenceId: s.conf,
      roomId: s.room,
      title: s.title,
      abstract: s.abstract,
      track: s.track,
      startsAt: at(day(s.conf), s.start),
      endsAt: at(day(s.conf), s.end),
      livestreamUrl: s.livestreamUrl ?? null,
      transcriptUrl: s.aiSummary
        ? `https://cdn.converge.dev/transcripts/${id}.vtt`
        : null,
      aiSummary: s.aiSummary ?? null,
    })
    for (const sp of s.speakers) {
      await db
        .insert(sessionSpeaker)
        .values({ sessionId: id, userId: U(sp) })
        .onConflictDoNothing()
    }
  }
  const S = (key: string) => sessionIds.get(key)!
  console.log(`  ✓ ${sessions.length} sessions`)

  /* --- session resources (links a speaker shared) --- */
  const resources: Array<{
    session: string
    label: string
    url: string
  }> = [
    {
      session: 'rs-compiler',
      label: 'Slides — The React Compiler in practice',
      url: 'https://example.com/react-compiler-slides',
    },
    {
      session: 'rs-compiler',
      label: 'eslint-plugin-react-compiler',
      url: 'https://github.com/facebook/react/tree/main/compiler',
    },
    {
      session: 'rs-rsc',
      label: 'RSC data-fetching patterns repo',
      url: 'https://github.com/example/rsc-patterns',
    },
    {
      session: 'js-mcp-apps',
      label: 'MCP Apps (SEP-1865) spec',
      url: 'https://modelcontextprotocol.io',
    },
  ]
  for (const [i, r] of resources.entries()) {
    await db.insert(sessionResource).values({
      sessionId: S(r.session),
      label: r.label,
      url: r.url,
      sortOrder: i,
    })
  }
  console.log(`  ✓ ${resources.length} session resources`)

  /* --- moments (bookmarked highlights within talks) --- */
  const moments: Array<{
    session: string
    user: string
    ms: number
    snippet: string
    note?: string
    slide?: string
    ai?: boolean
  }> = [
    {
      session: 'rs-compiler',
      user: 'devin',
      ms: 8 * 60_000,
      snippet:
        'You can basically delete most of your useMemo and useCallback calls.',
      note: 'Finally. Try this on the checkout page Monday.',
      slide: '#14',
      ai: true,
    },
    {
      session: 'rs-compiler',
      user: 'priya',
      ms: 18 * 60_000,
      snippet:
        'The compiler bails out the moment it sees a mutation it cannot prove is safe.',
      note: 'This is the gotcha for our team',
    },
    {
      session: 'rs-rsc-next',
      user: 'theo',
      ms: 22 * 60_000,
      snippet: 'The boundary between server and client is the new core skill.',
      ai: true,
    },
    {
      session: 'rs-rsc-next',
      user: 'noa',
      ms: 12 * 60_000,
      snippet:
        'Each piece of your app runs where it belongs, and the mental model stays the same: components.',
      note: 'This is exactly the model I want for Tidereel',
      slide: '#9',
    },
    {
      session: 'rs-post-spa',
      user: 'jonas',
      ms: 9 * 60_000,
      snippet:
        'Most user journeys never persisted state across screens — the SPA tax was never worth it for them.',
      note: 'Re-evaluate our SPA assumptions',
    },
    {
      session: 'js-esm-node',
      user: 'devin',
      ms: 14 * 60_000,
      snippet:
        "Node's ESM loader does resolution, linking, and evaluation before a single line of your code runs.",
      ai: true,
    },
    {
      session: 'js-chunking',
      user: 'priya',
      ms: 11 * 60_000,
      snippet:
        'Bad chunking is the difference between a 200kb initial load and a 2mb one.',
      note: 'Initial-load budget — flag for the platform team',
    },
    {
      session: 'rs-failure',
      user: 'devin',
      ms: 16 * 60_000,
      snippet:
        'Resilience is a frontend concern — atomic changes, feature flags, and rollbacks tied to your SLOs.',
      slide: '#21',
    },
    {
      session: 'rs-vibe',
      user: 'grace',
      ms: 25 * 60_000,
      snippet:
        'We shape software through collaboration with AI now — not syntax.',
      ai: true,
    },
    {
      session: 'js-tanstack-ai',
      user: 'theo',
      ms: 7 * 60_000 + 30_000,
      snippet:
        "Backpressure is the hidden cost nobody benchmarks — your client will buffer silently until it doesn't.",
      note: 'Check if our streaming proxy handles this',
      slide: '#5',
      ai: true,
    },
    {
      session: 'js-tanstack-ai',
      user: 'finn',
      ms: 12 * 60_000,
      snippet:
        'Abort controllers are your best friend. If the user navigates away, you have to stop the model.',
      slide: '#8',
    },
    {
      session: 'js-tanstack-ai',
      user: 'imani',
      ms: 18 * 60_000,
      snippet:
        'Token budget on the server side — never let the model output more than the UI can meaningfully render.',
      note: 'Hard limit for our chat feature',
    },
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
  const notes: Array<{
    user: string
    session?: string
    kind?: string
    body: string
  }> = [
    {
      user: 'devin',
      session: 'rs-compiler',
      body: 'TODO: audit our codebase for manual memoization once we upgrade. Ask Priya if we can bump React this quarter.',
    },
    {
      user: 'priya',
      session: 'js-chunking',
      body: 'Our initial bundle is 2mb — chunking is the lever. Action: audit the design-system repo first (smallest blast radius).',
    },
    {
      user: 'noa',
      body: 'Glasswire Sync might be the answer for offline. Talk to Sasha — could save me months.',
    },
    {
      user: 'jonas',
      kind: 'voice',
      body: 'Voice memo: ask the post-SPA talk speaker how View Transitions hold up with a real router. Recorded in the hallway.',
    },
    {
      user: 'theo',
      session: 'rs-rsc-next',
      body: 'Server/client boundary as the core skill — good framing for the next video.',
    },
    {
      user: 'grace',
      body: 'Hallway idea: a workshop on incremental RN architecture migration. There is clearly demand.',
    },
  ]
  for (const n of notes) {
    await db.insert(note).values({
      userId: U(n.user),
      sessionId: n.session ? S(n.session) : null,
      kind: n.kind ?? 'text',
      body: n.body,
      audioUrl:
        n.kind === 'voice'
          ? `https://cdn.converge.dev/notes/${uid()}.webm`
          : null,
    })
  }
  console.log(`  ✓ ${notes.length} notes`)

  /* --- questions + answers --- */
  const questionIds = new Map<string, string>()
  const questions: Array<{
    key: string
    session: string
    author: string
    body: string
    status?: string
    upvotes: number
    answers?: Array<{ author: string; body: string; fromSpeaker?: boolean }>
  }> = [
    {
      key: 'q-compiler-eslint',
      session: 'rs-compiler',
      author: 'devin',
      upvotes: 47,
      status: 'answered',
      body: 'If the compiler memoizes everything, is the react-hooks/exhaustive-deps lint rule still useful?',
      answers: [
        {
          author: 'mark',
          fromSpeaker: true,
          body: 'Yes — the rule still catches genuinely missing dependencies that would change behaviour, not just performance. Keep it on.',
        },
        {
          author: 'theo',
          body: 'Was about to ask the same thing. Good to know.',
        },
      ],
    },
    {
      key: 'q-compiler-bailout',
      session: 'rs-compiler',
      author: 'priya',
      upvotes: 31,
      status: 'answered',
      body: 'How do we know when the compiler has bailed out on a component in production?',
      answers: [
        {
          author: 'mark',
          fromSpeaker: true,
          body: 'The React DevTools shows a “Memo ✨” badge on compiled components. No badge means it bailed — usually a mutation or a ref escape.',
        },
      ],
    },
    {
      key: 'q-platform-replace',
      session: 'rs-platform',
      author: 'noa',
      upvotes: 22,
      status: 'answered',
      body: 'Which React patterns are you replacing with native web platform features first?',
      answers: [
        {
          author: 'scott',
          fromSpeaker: true,
          body: 'Dialog, popover, and details/summary cover a huge amount of what we used to hand-build — and they are accessible by default. Start there, then look at anchor positioning.',
        },
      ],
    },
    {
      key: 'q-post-spa-nav',
      session: 'rs-post-spa',
      author: 'jonas',
      upvotes: 19,
      status: 'open',
      body: 'If we move off the SPA model, do we lose the instant in-app navigation users are used to?',
    },
    {
      key: 'q-specs-migrate',
      session: 'rs-specs',
      author: 'devin',
      upvotes: 14,
      status: 'open',
      body: 'For a big migration, is it worth writing a spec up front, or do you just prompt your way through it with the agent?',
    },
    {
      key: 'q-failure-rollout',
      session: 'rs-failure',
      author: 'priya',
      upvotes: 26,
      status: 'answered',
      body: 'How do you keep a risky frontend change from taking down production?',
      answers: [
        {
          author: 'faris',
          fromSpeaker: true,
          body: 'Atomic changes behind feature flags, with automated rollbacks tied to your SLOs. If the error budget starts burning, the flag flips off before anyone gets paged.',
        },
      ],
    },
    {
      key: 'q-streaming-backpressure',
      session: 'js-tanstack-ai',
      author: 'theo',
      upvotes: 28,
      status: 'answered',
      body: "How does TanStack AI handle backpressure when the client can't consume tokens as fast as the model produces them?",
      answers: [
        {
          author: 'alem',
          fromSpeaker: true,
          body: 'ReadableStream with a TransformStream as a token buffer. If the queue depth exceeds a threshold we pause the upstream and let the UI drain. The key is never dropping tokens — buffering is fine, losing data is not.',
        },
        {
          author: 'theo',
          body: 'This is the piece I was missing. Going to spike on this tomorrow.',
        },
      ],
    },
    {
      key: 'q-streaming-abort',
      session: 'js-tanstack-ai',
      author: 'lukas',
      upvotes: 21,
      status: 'answered',
      body: 'If the user cancels mid-stream, does the model keep running and billing you on the server?',
      answers: [
        {
          author: 'alem',
          fromSpeaker: true,
          body: 'Yes, unless you propagate the AbortSignal all the way through. Pass it to the fetch, then forward it to the SDK. Most providers stop billing the moment the connection drops — but you have to actually close it.',
        },
      ],
    },
    {
      key: 'q-streaming-edge',
      session: 'js-tanstack-ai',
      author: 'finn',
      upvotes: 15,
      status: 'open',
      body: 'Does streaming LLM responses work well from edge runtimes, or does the cold start kill the TTFT advantage?',
    },
    {
      key: 'q-rsc-tanstack-query',
      session: 'rs-rsc',
      author: 'devin',
      upvotes: 34,
      status: 'answered',
      body: 'Does this play nicely with TanStack Query, or do RSC and client-side caching just fight each other the whole time?',
      answers: [
        {
          author: 'manuel',
          fromSpeaker: true,
          body: 'They are complementary, not competing. In TanStack Start, RSC is just data — it flows into the same cache as everything else. RSC handles the initial fetch and server work; Query owns client cache and invalidation. The boundary is the serialization point — what crosses it is data, not cache state.',
        },
        {
          author: 'noa',
          body: 'We use both in Tidereel. RSC for the page shell, Query for everything that updates without a navigation. The only footgun is deduplication — make sure you are not fetching the same data twice.',
        },
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
    title: string
    topic?: string
    conf?: string
    session?: string
    project?: string
    question?: string
    createdBy: string
    posts: Post[]
  }> = [
    {
      title: 'React Compiler: who has shipped it to prod?',
      topic: 'react-compiler',
      conf: reactSummitId,
      session: 'rs-compiler',
      question: 'q-compiler-bailout',
      createdBy: 'devin',
      posts: [
        {
          author: 'devin',
          body: 'After Mark Erikson’s talk I’m convinced. Anyone running the compiler in production already? What broke?',
          replies: [
            {
              author: 'mark',
              body: 'We’ve had it on for ~6 months at work. The only real surprise was a few components that mutated props in render — those bailed silently until we fixed them.',
            },
            {
              author: 'priya',
              body: 'We’re gated on a React upgrade. Mark, did you need any codemods or was it just turning the plugin on?',
              replies: [
                {
                  author: 'mark',
                  body: 'Just the Babel/SWC plugin + the eslint plugin to catch rule-of-React violations. No codemod.',
                },
              ],
            },
          ],
        },
        {
          author: 'theo',
          body: 'Doing a video on this. Will link the repo here when it’s up.',
        },
      ],
    },
    {
      title: 'Local-first: is it ready for real apps?',
      topic: 'local-first',
      conf: reactSummitId,
      project: 'glasswire',
      createdBy: 'noa',
      posts: [
        {
          author: 'noa',
          body: 'Sasha’s sync engine looks like exactly what I need for Tidereel’s offline mode. Anyone using Glasswire in anger yet?',
          replies: [
            {
              author: 'sasha',
              body: 'It’s early but stable for single-user-multi-device. Multi-user collaboration is the next milestone. Happy to pair if you want to try it.',
            },
            {
              author: 'yuki',
              body: 'I contributed the edge-sync adapter — works great with Durable Objects if you go that route.',
            },
          ],
        },
      ],
    },
    {
      title: 'Cutting build & CI time — war stories wanted',
      topic: 'ci-performance',
      conf: jsnationId,
      session: 'js-chunking',
      createdBy: 'priya',
      posts: [
        {
          author: 'priya',
          body: "Goal: halve our CI. After Tobias's chunking talk I'm rethinking our build config. What else moved the needle for you?",
          replies: [
            {
              author: 'sven',
              body: 'Bundling is usually not the CI bottleneck — test sharding and a remote cache win bigger. But smarter chunking helps cold builds and cache hit-rate.',
            },
            {
              author: 'aisha',
              body: 'Parallelise your e2e suite and kill flaky retries. A flaky test that retries 3x is 3x the CI cost.',
            },
            {
              author: 'lukas',
              body: 'Profile the runner itself. We found 40% of our “CI time” was just installing dependencies.',
            },
          ],
        },
      ],
    },
    {
      title: 'Coffee: RSC data-fetching patterns',
      topic: 'react-server-components',
      conf: reactSummitId,
      session: 'rs-rsc',
      question: 'q-rsc-tanstack-query',
      createdBy: 'devin',
      posts: [
        {
          author: 'devin',
          body: "After Manuel's talk I want to nail down when to reach for RSC vs TanStack Query for data. Anyone settled on a pattern they're happy with?",
          replies: [
            {
              author: 'manuel',
              body: 'Rule of thumb I use: if the data is only needed for the initial render and does not change while the user is on the page, RSC. If it can be invalidated, refetched, or mutated by the client, TanStack Query. Most pages need both.',
            },
            {
              author: 'noa',
              body: 'We went further and wrote a decision tree for our team. RSC for page-level queries that depend on URL params, Query for everything inside interactive components. Has basically eliminated the "which one do I use" conversation.',
              replies: [
                {
                  author: 'devin',
                  body: 'Would love a link to that decision tree if you are open to sharing it.',
                },
                {
                  author: 'noa',
                  body: "I'll clean it up and drop it in the Tidereel repo — will post here when it's up.",
                },
              ],
            },
            {
              author: 'sasha',
              body: 'The other thing nobody talks about: prefetching. RSC lets you start the DB query before the component tree renders. With Query you are always one tick late. For above-the-fold content that latency matters.',
            },
          ],
        },
        {
          author: 'theo',
          body: 'Going to cover this in a video this week. The streaming angle is underrated — RSC + Suspense means your shell renders instantly and slots fill in. Query can not do that without a separate skeleton state.',
          replies: [
            {
              author: 'imani',
              body: 'The skeleton state thing is real. We had a whole pattern for it before RSC. Now it is just Suspense and a fallback.',
            },
          ],
        },
      ],
    },
    {
      title: 'Hiring: senior React roles across the EU',
      topic: 'jobs',
      conf: reactSummitId,
      createdBy: 'tom',
      posts: [
        {
          author: 'tom',
          body: 'I’ve got 6 senior frontend roles open (remote-EU + Amsterdam hybrid). React, TS, design-systems experience valued. DM me or drop a note here.',
          replies: [
            {
              author: 'devin',
              body: 'Not senior yet but following for when I am 👀',
            },
            {
              author: 'imani',
              body: 'Tom, do any of them involve design-system work specifically? Happy to refer people.',
            },
          ],
        },
      ],
    },
  ]
  let postCount = 0
  let rscDiscussionId: string | null = null
  for (const d of discussions) {
    const did = uid()
    if (d.topic === 'react-server-components') rscDiscussionId = did
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

  /* --- meetups (the RSC thread that became a real-world meetup) --- */
  if (rscDiscussionId) {
    const meetupId = uid()
    await db.insert(meetup).values({
      id: meetupId,
      discussionId: rscDiscussionId,
      title: 'Coffee: RSC data-fetching patterns',
      startsAt: new Date(Date.now() + 2 * 60 * 60_000),
      location: 'Coffee bar, level 1',
      createdById: U('devin'),
    })
    for (const who of ['devin', 'sasha', 'theo']) {
      await db
        .insert(meetupAttendee)
        .values({ meetupId, userId: U(who) })
        .onConflictDoNothing()
    }
    console.log('  ✓ 1 meetup')
  }

  /* --- direct messages --- */
  const dms: Array<{ from: string; to: string; body: string; read?: boolean }> =
    [
      {
        from: 'noa',
        to: 'sasha',
        body: 'Hey! Loved your take on local-first in the thread. Could I grab 15 min about using Glasswire for Tidereel?',
        read: true,
      },
      {
        from: 'sasha',
        to: 'noa',
        body: 'Absolutely — I’m at the OSS booth till 4, or coffee tomorrow morning?',
        read: true,
      },
      {
        from: 'noa',
        to: 'sasha',
        body: 'Coffee tomorrow is perfect. 9am at the Atrium café?',
        read: false,
      },
      {
        from: 'tom',
        to: 'devin',
        body: 'Saw you asking great questions in the compiler talk. Not recruiting you (yet!) but let’s stay in touch.',
        read: true,
      },
      {
        from: 'priya',
        to: 'mara',
        body: 'Your take on the server/client boundary finally made it click for my team. Any chance you’d do an internal talk?',
        read: false,
      },
      {
        from: 'jonas',
        to: 'yuki',
        body: 'That edge SSR / data-locality problem you mentioned hit home. We have the exact issue at DeepL. Mind if I follow up over email?',
        read: false,
      },
      {
        from: 'imani',
        to: 'tom',
        body: 'Re: your roles — I know two strong design-system engineers looking. Sending intros.',
        read: true,
      },
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
  const connections: Array<{
    a: string
    b: string
    status?: string
    note?: string
  }> = [
    {
      a: 'noa',
      b: 'sasha',
      status: 'accepted',
      note: 'Met at React Summit — exploring Glasswire for Tidereel.',
    },
    {
      a: 'devin',
      b: 'priya',
      status: 'accepted',
      note: 'Same company, finally met in person at the conf.',
    },
    {
      a: 'devin',
      b: 'tom',
      status: 'accepted',
      note: 'Recruiter, keep warm for ~1 year.',
    },
    {
      a: 'priya',
      b: 'mara',
      status: 'pending',
      note: 'Asked about an internal talk.',
    },
    {
      a: 'jonas',
      b: 'yuki',
      status: 'pending',
      note: 'Edge SSR / data locality follow-up.',
    },
    { a: 'imani', b: 'tom', status: 'accepted' },
    {
      a: 'theo',
      b: 'mara',
      status: 'accepted',
      note: 'Recording a video about the compiler together.',
    },
    {
      a: 'finn',
      b: 'yuki',
      status: 'accepted',
      note: 'WebGPU + edge rendering nerds unite.',
    },
  ]
  for (const c of connections) {
    await db
      .insert(connection)
      .values({
        userId: U(c.a),
        contactId: U(c.b),
        status: c.status ?? 'pending',
        note: c.note ?? null,
      })
      .onConflictDoNothing()
    // mirror accepted connections so both sides see them
    if ((c.status ?? 'pending') === 'accepted') {
      await db
        .insert(connection)
        .values({
          userId: U(c.b),
          contactId: U(c.a),
          status: 'accepted',
          note: c.note ?? null,
        })
        .onConflictDoNothing()
    }
  }
  console.log(`  ✓ ${connections.length} connections`)

  /* --- personal tasks (agent-managed surface) --- */
  const tasks: Array<{
    user: string
    title: string
    done?: boolean
    due?: string
  }> = [
    {
      user: 'devin',
      title: 'Audit checkout page for manual memoization after React upgrade',
      due: `${REACT_SUMMIT_DAY}T20:00`,
    },
    {
      user: 'devin',
      title: 'Follow up with Tom (recruiter) in Q4',
      due: '2026-10-01T09:00',
    },
    {
      user: 'devin',
      title: 'Watch the recording of the testing talk',
      done: false,
    },
    {
      user: 'priya',
      title: 'Audit chunking on the design-system repo',
      due: `${REACT_SUMMIT_DAY}T18:00`,
    },
    { user: 'priya', title: 'Send Mara an internal-talk invite', done: false },
    {
      user: 'priya',
      title: 'Share CI war-stories thread with the platform team',
      done: true,
    },
    {
      user: 'noa',
      title: 'Coffee with Sasha — Atrium café 9am',
      due: `${REACT_SUMMIT_DAY}T09:00`,
    },
    {
      user: 'noa',
      title: 'Prototype Tidereel offline mode on Glasswire',
      done: false,
    },
    { user: 'jonas', title: 'Email Yuki re: edge data locality', done: false },
    {
      user: 'imani',
      title: 'Send Tom two design-system engineer intros',
      done: true,
    },
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
