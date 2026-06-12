import { PageHeader } from '#/components/page-header'

export function FeaturePlaceholder({
  title,
  subtitle,
  buildOut: _buildOut,
}: {
  title: string
  subtitle?: string
  buildOut: Array<string>
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
    </div>
  )
}
