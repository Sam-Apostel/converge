/**
 * Livestream config + YouTube URL helpers.
 */

/** The YouTube video id for a session's livestream URL, or `null` to fall back to slides. */
export function livestreamFor(url: string | null | undefined): string | null {
  return url ? youtubeId(url) : null
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
