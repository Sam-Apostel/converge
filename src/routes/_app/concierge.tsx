import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@progress/kendo-react-buttons'

import { PageHeader } from '#/components/page-header'

const prompts = [
  'Who should I meet?',
  'What did I miss?',
  'Summarize today’s talks.',
  'Find AI engineers interested in manufacturing.',
  'Schedule coffee chats.',
  'Find projects related to my interests.',
]

export const Route = createFileRoute('/_app/concierge')({
  component: ConciergePage,
})

function ConciergePage() {
  return (
    <div>
      <PageHeader
        title="AI Concierge"
        subtitle="Your guide to the conference. Ask anything — the concierge can act on the same data exposed through the Converge MCP server."
      />

      <div className="rounded-2xl border border-black/5 bg-white/70 p-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="rounded-xl border border-black/5 bg-white px-4 py-3 text-left text-sm transition-transform hover:scale-[0.99] hover:border-brand-200"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <input
            disabled
            placeholder="Ask the concierge… (wire up to your model + MCP tools)"
            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
          <Button themeColor="primary" disabled>
            Send
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          To build: stream responses from a Claude model, give it the Converge
          MCP tools (people, sessions, projects, personal), and render results
          inline.
        </p>
      </div>
    </div>
  )
}
