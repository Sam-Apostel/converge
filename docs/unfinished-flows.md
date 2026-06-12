# Unfinished & mocked flows

A post-hackathon chart of everything that is still mocked, stubbed or
half-built. Status reflects the `project-completion-flows-storage` branch —
items marked ✅ were finished there.

## Shipped on this branch

| Flow | Was | Now |
| --- | --- | --- |
| ✅ Document storage | No upload code anywhere; `user.image` and `project.screenshots` were dead fields fed only by seed URLs | `document` table (bytes in Postgres), `POST /api/documents` (multipart, size/type-capped), immutable `GET /api/documents/$id` |
| ✅ Avatar upload | Hardcoded `NAME_AVATARS` map in `src/components/ui/avatar.tsx` was the only way to get a photo | Upload from the profile screen → stored document → `user.image`; nav avatars use the session image |
| ✅ Profile screen | `/profile` showed name + email + sign-out only; every `profile` column (headline, bio, intents, topics, availability, socials…) had no edit UI | Full editor for account + profile fields, availability setting, socials, public-profile link, sign out (`src/routes/_app/profile.tsx`, `src/lib/queries/me.ts`) |
| ✅ Project registration | `POST /api/projects` existed but no UI called it | `/projects/new` form (basics, screenshot upload, tech stack, looking-for, links) with unique-slug handling; entry points on `/projects` and `/profile` |
| ✅ Project screenshots & links | Detail/featured cards rendered a hard-coded "project screenshot" hatch; `project.links` was never displayed | Real first screenshot rendered when present (placeholder hatch kept as fallback); link chips on the detail page |

## Still open

### Auth viewer fallback

The acting user falls back to the earliest-seeded user when there is no
session, so the demo works logged-out. Fine for demos, wrong for production.

- `src/lib/concierge/viewer.ts` — `resolveViewerId` (used by concierge,
  AI settings, and the new profile queries)
- `src/lib/queries/messages.ts:24` — `resolveViewer` (messages, connections,
  people suggestions)
- `src/routes/api/messages.ts` — `fromUserId` comes from the request body
- `src/routes/api/connections.ts` — acting user via `resolveViewer`

Fix: replace both helpers with `requireUser` / session-only resolution once
logged-out demo mode is no longer needed.

### Buttons with no behavior

- **Message owner** — `src/routes/_app/projects/index.tsx` and
  `projects/$slug.tsx`: "Message {owner}" buttons don't navigate to
  `/messages` or open a thread.
- **Star a project** — same files: the Star badge is decorative;
  `trendingScore` is only ever written by the seed.
- **Save my seat** — `src/routes/_app/index.tsx`: no handler; there is no
  "my schedule"/RSVP model behind it.
- **Category pills** — `src/routes/_app/projects/index.tsx`: `CATEGORIES`
  filter pills are static and don't filter (and don't match the real
  `project.category` values).

### Flows with a missing half

- **Incoming connection requests** — `POST/PATCH /api/connections` can create
  and accept, but there is no inbox UI to see or accept pending requests.
- **Onboarding** — sign-up creates a bare user; nothing routes new users to
  the profile editor. A first-login redirect to `/profile` would close it.
- **Project editing & members** — projects can be registered but not edited;
  `projectMember` rows have no management UI.
- **Messages attachments** — messages are text-only; the document store could
  back image sharing now.
- **Live session data** — transcript/slide widgets in
  `src/components/session/` run on simulated timing data
  (`livestream.ts`, `slides.ts`).

### Data

- `src/scripts/seed.ts` — all people, projects, sessions, Q&A and messages
  are synthetic; avatars come from dicebear/imgix URLs.
- `project.trendingScore` — a hardcoded integer with no algorithm behind it.
