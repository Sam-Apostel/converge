import type { UIMessage } from '@tanstack/ai-react'
import { Sparkles } from 'lucide-react'

import { Mono } from '#/components/ui'

import { ToolResult } from './tool-result'

/**
 * Render one concierge message (silo 7).
 *
 * Walks the message `parts`: text and thinking render as prose; tool calls
 * render a small "ran X" line plus an inline result card once the result
 * arrives. Standalone `tool-result` parts are folded into their originating
 * call (matched by id), so we skip them in the main loop.
 */

type Part = UIMessage['parts'][number]

/** Best-effort parse of a tool result's content into an object. */
function parseToolOutput(part: Part): unknown {
  // The streamed tool-call part may carry the decoded output directly.
  if (part.type === 'tool-call' && 'output' in part && part.output != null) {
    return part.output
  }
  if (part.type === 'tool-result') {
    const { content } = part
    const raw =
      typeof content === 'string'
        ? content
        : content
            .map((c) =>
              'content' in c && typeof c.content === 'string' ? c.content : '',
            )
            .join('')
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return null
}

function humanizeTool(name: string): string {
  return name.replace(/_/g, ' ')
}

export function ConciergeMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'

  // Index tool-result parts by the call they answer.
  const resultsByCallId = new Map<string, unknown>()
  for (const part of message.parts) {
    if (part.type === 'tool-result') {
      resultsByCallId.set(part.toolCallId, parseToolOutput(part))
    }
  }

  if (isUser) {
    const text = message.parts
      .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
      .map((p) => p.content)
      .join('')
    if (!text) return null
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14.5px] leading-relaxed text-white shadow-card">
          {text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {message.parts.map((part, i) => {
        if (part.type === 'thinking') {
          if (!part.content) return null
          return (
            <details key={i} className="text-[12.5px] text-muted">
              <summary className="cursor-pointer select-none">
                Thinking…
              </summary>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-[12.5px] text-mist">
                {part.content}
              </pre>
            </details>
          )
        }

        if (part.type === 'text' && part.content) {
          return (
            <div
              key={i}
              className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-[14.5px] leading-relaxed text-ink shadow-card"
            >
              {part.content}
            </div>
          )
        }

        if (part.type === 'tool-call') {
          const output = parseToolOutput(part) ?? resultsByCallId.get(part.id)
          return (
            <div key={part.id} className="max-w-[90%]">
              <div className="flex items-center gap-1.5 px-1">
                <Mono tone="lime" className="inline-flex items-center gap-1">
                  <Sparkles size={12} /> {humanizeTool(part.name)}
                </Mono>
                {part.state !== 'complete' ? (
                  <span className="text-[11.5px] text-faint">running…</span>
                ) : null}
              </div>
              <ToolResult output={output} />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
