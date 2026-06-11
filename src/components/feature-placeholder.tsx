import { PageHeader } from '#/components/page-header'

/**
 * A styled placeholder for screens that are scaffolded but not yet built.
 * `buildOut` lists what a feature agent should implement here — these mirror the
 * GitHub epics for Converge.
 */
export function FeaturePlaceholder({
  title,
  subtitle,
  buildOut,
}: {
  title: string
  subtitle?: string
  buildOut: Array<string>
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          To build
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {buildOut.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-ink/80"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
