import { Fragment } from 'react'

import { Card } from '#/components/ui'

/** The five stages a question travels through, with the connectors between them. */
const STAGES = [
  { glyph: 'Q', label: 'Question', chip: 'bg-ink text-white', strong: true },
  { glyph: 'A', label: 'Answer', chip: 'bg-[#3a3e54] text-white', strong: true },
  { glyph: '↳', label: 'Follow-up', chip: 'bg-inner text-[#52566c]', strong: false },
  { glyph: '···', label: 'Community', chip: 'bg-inner text-[#52566c]', strong: false },
  { glyph: '◎', label: 'Meetup', chip: 'bg-lime text-ink', strong: true },
] as const

// Connector fills, left→right. The run into Meetup fades to lime.
const CONNECTORS = [
  'linear-gradient(90deg,#13141d,#c9cee0)',
  '#c9cee0',
  '#c9cee0',
  'linear-gradient(90deg,#c9cee0,#99ff00)',
]

/**
 * Horizontal Question → Answer → Follow-up → Community → Meetup rail — the spine
 * of the whole discussions surface.
 */
export function LifecycleRail() {
  return (
    <Card surface="white" className="mb-6 flex flex-wrap items-center px-[22px] py-4">
      {STAGES.map((stage, i) => (
        <Fragment key={stage.label}>
          {i > 0 && (
            <span
              className="mx-3.5 h-0.5 min-w-6 flex-1"
              style={{ background: CONNECTORS[i - 1] }}
            />
          )}
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={`grid size-6 place-items-center rounded-lg text-[12px] font-semibold ${stage.chip}`}
            >
              {stage.glyph}
            </span>
            <span
              className={`text-[13.5px] ${
                stage.strong ? 'font-semibold text-ink' : 'font-medium text-[#52566c]'
              }`}
            >
              {stage.label}
            </span>
          </span>
        </Fragment>
      ))}
    </Card>
  )
}
