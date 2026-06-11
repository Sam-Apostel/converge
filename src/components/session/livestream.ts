/**
 * Livestream config + YouTube URL helpers.
 *
 * There's no livestream column on `conferenceSession` yet, so for this first
 * iteration the live video is a single client-side constant used for every
 * session. TODO(schema): add `conferenceSession.livestreamUrl` and key the
 * stream off the row instead of this default.
 */

/** React Summit's live broadcast — the demo stream. */
export const DEFAULT_LIVESTREAM_ID = 'C0dnfm48K4Q'

/** The livestream video id for a session, or `null` to fall back to slides. */
export function livestreamFor(_sessionId: string): string | null {
  return DEFAULT_LIVESTREAM_ID
}

/** Extract a YouTube video id from a watch/share/embed URL (or pass an id). */
export function youtubeId(input: string): string | null {
  if (/^[\w-]{11}$/.test(input)) return input
  const match = input.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/)([\w-]{11})/)
  return match ? match[1] : null
}

/** The video's static poster — there's no public per-timestamp live frame. */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** A deep link that resumes the stream at `seconds`. */
export function youtubeDeepLink(id: string, seconds: number): string {
  return `https://youtu.be/${id}?t=${Math.max(0, Math.floor(seconds))}`
}
