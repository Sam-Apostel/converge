# Silo 3 — People & Project detail pages

> Read [`README.md`](./README.md) first. Design sources: the **profile panels** in
> **§5** (People, lines ~591–634) and **§4** (Project, lines ~497–523) of
> `design/Converge.dc.html`. The index pages already render a *compact* version of
> each panel inline — your job is the **full standalone pages**.

The two detail routes are currently `FeaturePlaceholder`s. Build them for real.

## Owns (write only here)

- `src/routes/_app/people/$userId.tsx` — full person profile
- `src/routes/_app/projects/$slug.tsx` — full project profile
- `src/lib/queries/profiles.ts` — `getPersonById`, `getProjectBySlug`

## Build

**Person (`people/$userId.tsx`)** — load the `user` + `profile` by id. Header:
`Avatar` (large) + name + `title · company` + a dark **Connect** `Button`. Then:
- **WHY I'M HERE** card (`Mono` eyebrow) on a `linear-gradient(135deg,#f3ffe0,
  #eef0f8)` — `profile.bio`.
- **CURRENT FOCUS** — `profile.currentFocus`.
- Two columns: **TALK TO ME ABOUT** (`Tag variant="lime"` from
  `interestedTopics`) and **PLEASE DON'T** (`Tag variant="strike"` from
  `notInterestedTopics`, `Mono tone="mute"`).
- **PROJECTS** — this person's `project` rows (join `project` where
  `ownerId = userId`, or via `projectMember`): small rows with a squircle `Avatar`
  + name + blurb + `↗`, linking to `/projects/$slug`.
- Optionally: shared sessions / a back link to the directory.

**Project (`projects/$slug.tsx`)** — load `project` by slug + owner + members.
Header: squircle `Avatar` (initials = name.slice(0,2)) + name + `by {owner} ·
{category}` + a lime `★ {trendingScore}` badge. Then: a `Thumb` screenshot, the
`description`, **TECH STACK** (`Tag` from `techStack`), a **LOOKING FOR** row
(`bg-inner`) with an `AvatarStack` of members, a related-talk line (find a
`conferenceSession` where the speaker is the owner → "Related talk · '…' · time"),
and CTAs (`Message {owner}` dark + `★ Star` soft). The compact version lives in
`src/routes/_app/projects/index.tsx` — mirror its styling, expand the content.

## Data

`getPersonById(id)` → `{ user, profile, projects }`. `getProjectBySlug(slug)` →
`{ project, ownerName, members, relatedTalk }`. Put both in
`src/lib/queries/profiles.ts`. Use `Person` from `#/db/types`. For the person's
match%/presence (the design shows neither on the full page, but if you add it) use
`#/lib/demo`. Handle not-found (`throw notFound()` / a friendly empty state).

## Don't

Don't touch the index pages (`people/index.tsx`, `projects/index.tsx`), the
shell, `ui/`, or `lib/queries.ts`. No schema changes. No new routes are added
(both files already exist in the route tree).

## Done when

`/people/<id>` and `/projects/<slug>` render full profiles from real data and link
to each other; typecheck + build pass; PR opened.
