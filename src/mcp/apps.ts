import { createUIResource } from '@mcp-ui/server'

import type { Person } from '#/db/types'

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
