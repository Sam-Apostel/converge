/**
 * Conference selection — the app shows one conference at a time, but the data
 * model holds several co-located events (e.g. JSNation + React Summit). The
 * "active" conference is persisted in a cookie so every scoped query
 * (`listSessions`, the home summary) and the header switcher agree on it.
 *
 * The cookie-touching helpers live in the server-only `active-conference.ts`;
 * this module only exposes the client-callable server functions + the type.
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

import {
  CONFERENCE_COOKIE,
  loadConferenceSummaries,
  pickActiveConference,
} from '#/lib/queries/active-conference'
import type { ConferenceSummary } from '#/lib/queries/active-conference'

export type { ConferenceSummary }

export type ConferenceContext = {
  conferences: Array<ConferenceSummary>
  /** The active conference id, or null when none are seeded. */
  activeId: string | null
}

/** The conferences list plus the active id — drives the header switcher. */
export const getConferenceContext = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ConferenceContext> => {
    const conferences = await loadConferenceSummaries()
    return {
      conferences,
      activeId: pickActiveConference(conferences, getCookie(CONFERENCE_COOKIE)),
    }
  },
)

/** Switch the active conference. Validates the id, persists it, echoes context. */
export const setActiveConference = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ConferenceContext> => {
    const conferences = await loadConferenceSummaries()
    const target = conferences.find((c) => c.id === id || c.slug === id)
    if (target) {
      setCookie(CONFERENCE_COOKIE, target.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 180,
      })
    }
    return {
      conferences,
      activeId:
        target?.id ??
        pickActiveConference(conferences, getCookie(CONFERENCE_COOKIE)),
    }
  })
