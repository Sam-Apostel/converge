/**
 * The live slide deck for a talk. Real capture would come from the stage feed;
 * for now we model a believable, generic deck and walk a playhead through it —
 * every bookmark advances one slide. Keep this presentational/deterministic so
 * SSR and the client agree.
 */

export type Slide = { n: number; topic: string }

const TOPICS = [
  'Welcome & agenda',
  'Why this matters now',
  'The mental model',
  'A first example',
  'Live demo',
  'Under the hood',
  'Common pitfalls',
  'Performance notes',
  'Migration path',
  'Edge cases',
  "What's shipping next",
  'Recap & resources',
] as const

export const SLIDES: Array<Slide> = TOPICS.map((topic, i) => ({
  n: i + 1,
  topic,
}))

/** The slide the talk opens "live" on in the demo. */
export const INITIAL_SLIDE = 5

/** Each slide runs ~90s — gives every capture a plausible talk offset. */
export const SLIDE_MS = 90_000

/** How far through the *talk* (0–1) the playhead sits at a given slide. */
export function talkFraction(slideNumber: number): number {
  return Math.min(1, slideNumber / SLIDES.length)
}

/** A talk offset in ms → "m:ss". */
export function formatOffset(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
