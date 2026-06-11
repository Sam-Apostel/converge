/**
 * Demo-only personalization helpers.
 *
 * "Match %" and live presence are inherently relative to the *viewer*. Until
 * sign-in is wired up there is no viewer, so we derive stable stand-in values
 * from a row id purely so the design reads as intended. Replace these with real
 * affinity scoring + presence once auth + a current user exist.
 */

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Stable pseudo "match" score in 72–97 for a given id. */
export function demoMatch(id: string): number {
  return 72 + (hash(id) % 26)
}

/** Stable pseudo presence for a given id (~⅔ online). */
export function demoOnline(id: string): boolean {
  return hash(id + 'presence') % 3 !== 0
}
