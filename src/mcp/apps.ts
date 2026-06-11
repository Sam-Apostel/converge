import { createUIResource } from '@mcp-ui/server'

import type {
  ConferenceSession,
  Moment,
  Person,
  Project,
  Question,
} from '#/db/types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build an interactive "people directory" UI resource for MCP Apps hosts
 * (SEP-1865). Returned by the `search_people_app` tool; hosts that support MCP
 * Apps render this HTML in a sandboxed iframe, while the plain `search_people`
 * tool returns the same data as JSON.
 *
 * Clicking a card sends an MCP UI action (a `tool` call to `get_profile`) back
 * to the host via postMessage, which @mcp-ui/client forwards to the model.
 */
export function peopleDirectoryResource(people: Array<Person>, query: string) {
  const cards = people
    .map((person) => {
      const p = person.profile
      const headline = p?.headline ?? p?.title ?? ''
      const company = p?.company ?? ''
      const topics = (p?.interestedTopics ?? []).slice(0, 4)
      return `
      <button class="card" data-user-id="${escapeHtml(person.id)}">
        <div class="avatar">${escapeHtml((person.name || '?').charAt(0))}</div>
        <div class="body">
          <div class="name">${escapeHtml(person.name || 'Unknown')}</div>
          <div class="headline">${escapeHtml(headline)}${
            company ? ` · ${escapeHtml(company)}` : ''
          }</div>
          <div class="topics">${topics
            .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
            .join('')}</div>
        </div>
      </button>`
    })
    .join('')

  const htmlString = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 12px; }
  h1 { font-size: 14px; font-weight: 600; opacity: 0.6; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
  .card { display: flex; gap: 12px; align-items: center; text-align: left; width: 100%;
    border: 1px solid color-mix(in oklab, currentColor 14%, transparent); border-radius: 14px;
    padding: 12px; background: color-mix(in oklab, currentColor 4%, transparent); cursor: pointer;
    transition: transform 120ms ease, border-color 120ms ease; color: inherit; }
  .card:hover { transform: translateY(-1px); border-color: color-mix(in oklab, currentColor 32%, transparent); }
  .card:active { transform: scale(0.99); }
  .avatar { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
    font-weight: 600; background: color-mix(in oklab, #6366f1 80%, transparent); color: white; }
  .name { font-weight: 600; font-size: 14px; }
  .headline { font-size: 12px; opacity: 0.7; margin-top: 2px; }
  .topics { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
  .chip { font-size: 11px; padding: 1px 7px; border-radius: 999px;
    background: color-mix(in oklab, currentColor 10%, transparent); }
  .empty { opacity: 0.6; font-size: 13px; }
</style>
</head>
<body>
  <h1>People${query ? ` · "${escapeHtml(query)}"` : ''}</h1>
  ${people.length ? `<div class="grid">${cards}</div>` : `<div class="empty">No people found.</div>`}
  <script>
    document.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => {
        window.parent.postMessage({
          type: 'tool',
          payload: { toolName: 'get_profile', params: { userId: el.dataset.userId } },
        }, '*');
      });
    });
  </script>
</body>
</html>`

  return createUIResource({
    uri: `ui://converge/people-directory`,
    content: { type: 'rawHtml', htmlString },
    encoding: 'text',
  })
}

/**
 * Build an interactive "projects grid" UI resource. Returned by the
 * `list_projects_app` tool; clicking a card sends a `get_project` tool call
 * back to the host so the model can drill into a single project.
 */
export function projectsGridResource(projects: Array<Project>) {
  const cards = projects
    .map((project) => {
      const tech = (project.techStack ?? []).slice(0, 4)
      const looking = (project.lookingFor ?? []).slice(0, 3)
      return `
      <button class="card" data-project-id="${escapeHtml(project.id)}">
        <div class="head">
          <div class="name">${escapeHtml(project.name)}</div>
          ${
            project.category
              ? `<span class="cat">${escapeHtml(project.category)}</span>`
              : ''
          }
        </div>
        <div class="tagline">${escapeHtml(project.tagline ?? '')}</div>
        <div class="chips">${tech
          .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
          .join('')}</div>
        ${
          looking.length
            ? `<div class="looking">Looking for: ${looking
                .map((l) => escapeHtml(l))
                .join(', ')}</div>`
            : ''
        }
      </button>`
    })
    .join('')

  const htmlString = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 12px; }
  h1 { font-size: 14px; font-weight: 600; opacity: 0.6; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .card { display: flex; flex-direction: column; gap: 6px; text-align: left; width: 100%;
    border: 1px solid color-mix(in oklab, currentColor 14%, transparent); border-radius: 14px;
    padding: 14px; background: color-mix(in oklab, currentColor 4%, transparent); cursor: pointer;
    transition: transform 120ms ease, border-color 120ms ease; color: inherit; }
  .card:hover { transform: translateY(-1px); border-color: color-mix(in oklab, currentColor 32%, transparent); }
  .card:active { transform: scale(0.99); }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .name { font-weight: 600; font-size: 15px; }
  .cat { font-size: 11px; padding: 1px 8px; border-radius: 999px; flex: none;
    background: color-mix(in oklab, #99ff00 60%, transparent); color: #13141d; }
  .tagline { font-size: 12px; opacity: 0.7; }
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip { font-size: 11px; padding: 1px 7px; border-radius: 999px;
    background: color-mix(in oklab, currentColor 10%, transparent); }
  .looking { font-size: 11px; opacity: 0.6; margin-top: 2px; }
  .empty { opacity: 0.6; font-size: 13px; }
</style>
</head>
<body>
  <h1>Projects</h1>
  ${projects.length ? `<div class="grid">${cards}</div>` : `<div class="empty">No projects yet.</div>`}
  <script>
    document.querySelectorAll('.card').forEach((el) => {
      el.addEventListener('click', () => {
        window.parent.postMessage({
          type: 'tool',
          payload: { toolName: 'get_project', params: { projectId: el.dataset.projectId } },
        }, '*');
      });
    });
  </script>
</body>
</html>`

  return createUIResource({
    uri: `ui://converge/projects-grid`,
    content: { type: 'rawHtml', htmlString },
    encoding: 'text',
  })
}

type SessionSpeaker = { id: string; name: string; image: string | null }

/** Format a millisecond talk offset as `m:ss`. */
function formatOffset(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Build an interactive "session" UI resource: a talk header with its speakers,
 * bookmarked moments and Q&A. Returned by the `session_app` tool. Speaker chips
 * send a `get_profile` tool call back to the host.
 */
export function sessionResource(
  session: ConferenceSession,
  speakers: Array<SessionSpeaker>,
  moments: Array<Moment>,
  questions: Array<Question>,
) {
  const speakerChips = speakers
    .map(
      (s) =>
        `<button class="speaker" data-user-id="${escapeHtml(s.id)}">${escapeHtml(
          s.name,
        )}</button>`,
    )
    .join('')

  const momentItems = moments
    .map(
      (m) => `
      <li class="moment">
        <span class="ts">${formatOffset(m.timestampMs)}</span>
        <span class="body">${escapeHtml(
          m.note || m.transcriptSnippet || 'Bookmarked moment',
        )}</span>
        ${m.aiHighlight ? '<span class="ai">AI</span>' : ''}
      </li>`,
    )
    .join('')

  const questionItems = questions
    .map(
      (q) => `
      <li class="q">
        <span class="up">▲ ${q.upvotes}</span>
        <span class="body">${escapeHtml(q.body)}</span>
        <span class="status status-${escapeHtml(q.status)}">${escapeHtml(q.status)}</span>
      </li>`,
    )
    .join('')

  const htmlString = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 14px; }
  .title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
  .meta { font-size: 12px; opacity: 0.6; margin-bottom: 10px; }
  .meta .track { font-weight: 600; opacity: 0.8; }
  .abstract { font-size: 13px; opacity: 0.85; line-height: 1.45; margin: 0 0 12px; }
  .speakers { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .speaker { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; cursor: pointer;
    border: 1px solid color-mix(in oklab, currentColor 18%, transparent); color: inherit;
    background: color-mix(in oklab, currentColor 5%, transparent); transition: border-color 120ms ease; }
  .speaker:hover { border-color: color-mix(in oklab, currentColor 40%, transparent); }
  h2 { font-size: 12px; font-weight: 600; opacity: 0.55; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .moment, .q { display: flex; gap: 10px; align-items: baseline; font-size: 13px;
    padding: 8px 10px; border-radius: 10px; background: color-mix(in oklab, currentColor 4%, transparent); }
  .ts { font-variant-numeric: tabular-nums; font-weight: 600; opacity: 0.6; flex: none; }
  .ai { font-size: 10px; padding: 0 6px; border-radius: 999px; flex: none; font-weight: 700;
    background: color-mix(in oklab, #99ff00 60%, transparent); color: #13141d; }
  .moment .body, .q .body { flex: 1; }
  .up { font-variant-numeric: tabular-nums; opacity: 0.6; flex: none; }
  .status { font-size: 10px; padding: 0 6px; border-radius: 999px; flex: none;
    background: color-mix(in oklab, currentColor 10%, transparent); }
  .status-answered { background: color-mix(in oklab, #99ff00 50%, transparent); color: #13141d; }
  .empty { opacity: 0.5; font-size: 12px; }
</style>
</head>
<body>
  <h1 class="title">${escapeHtml(session.title)}</h1>
  <div class="meta">${
    session.track ? `<span class="track">${escapeHtml(session.track)}</span> · ` : ''
  }${session.startsAt ? escapeHtml(new Date(session.startsAt).toUTCString()) : 'Time TBA'}</div>
  ${session.abstract ? `<p class="abstract">${escapeHtml(session.abstract)}</p>` : ''}
  ${speakers.length ? `<div class="speakers">${speakerChips}</div>` : ''}

  <h2>Moments</h2>
  ${moments.length ? `<ul>${momentItems}</ul>` : `<div class="empty">No moments captured yet.</div>`}

  <h2>Q&amp;A</h2>
  ${questions.length ? `<ul>${questionItems}</ul>` : `<div class="empty">No questions yet.</div>`}

  <script>
    document.querySelectorAll('.speaker').forEach((el) => {
      el.addEventListener('click', () => {
        window.parent.postMessage({
          type: 'tool',
          payload: { toolName: 'get_profile', params: { userId: el.dataset.userId } },
        }, '*');
      });
    });
  </script>
</body>
</html>`

  return createUIResource({
    uri: `ui://converge/session`,
    content: { type: 'rawHtml', htmlString },
    encoding: 'text',
  })
}
