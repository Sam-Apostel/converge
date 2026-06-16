# Hackathon seed data

Real seed data for Converge, scraped from the **Progress x GitNation**
hackathon (HackathonParty #43 — co-located with React Summit / JSNation,
Amsterdam, June 2026): <https://www.hackathonparty.com/hackathons/43/projects>.

33 projects, their teams (50 people), taglines, pitch descriptions, tech
stacks, demo / repo / video links, avatars and the three winners.

## Files

| File | What it is |
| --- | --- |
| `scrape-hackathon-43.py` | Fetches each public project page, decodes the Next.js RSC payload, and writes the raw submissions + teams to `hackathon-43.raw.json`. |
| `hackathon-43.raw.json` | Raw scrape output, kept for provenance / re-processing. |
| `process-hackathon-43.py` | Transforms the raw JSON into the typed TS module below (cleans pitch HTML → text, derives tech stacks, slugs, synthesises handles/emails, ranks winners). |
| `hackathon-43.ts` | **Generated** typed data module consumed by the seed script. Do not hand-edit. |

## Refreshing

```bash
python3 src/scripts/data/scrape-hackathon-43.py   # re-fetch -> hackathon-43.raw.json
python3 src/scripts/data/process-hackathon-43.py  # transform -> hackathon-43.ts
```

## Seeding

`src/scripts/seed-hackathon.ts` loads `hackathon-43.ts` and upserts a
conference, the people (users + profiles) and their projects. It is **additive
and idempotent** — it never truncates, and re-running it is a no-op — so it can
run on its own or layered on top of the mock `db:seed`:

```bash
bun run db:seed:hackathon
```

> Emails and handles are synthesised (`<handle>@hackathonparty.seed`); no real
> contact details are scraped. Avatar/screenshot image URLs are the public ones
> served on the project pages.
