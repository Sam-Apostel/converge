import { Link, createFileRoute } from '@tanstack/react-router'
import { BorderBeam } from 'border-beam'

import { PageHeader } from '#/components/page-header'
import { listProjects } from '#/lib/queries'

export const Route = createFileRoute('/_app/projects/')({
  loader: () => listProjects(),
  component: ProjectsPage,
})

function ProjectsPage() {
  const projects = Route.useLoaderData()
  const [featured, ...rest] = projects

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Projects before companies. Browse what people are actually building — startups, side projects, research and open source."
      />

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-sm text-muted">
          No projects yet.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Trending project gets the border-beam treatment. */}
          <BorderBeam colorVariant="ocean" size="md">
            <article className="rounded-2xl bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Trending
              </p>
              <h2 className="mt-1 text-xl font-semibold">{featured.name}</h2>
              <p className="mt-1 text-sm text-muted">{featured.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(featured.techStack ?? []).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-black/5 px-2 py-0.5 text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          </BorderBeam>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((proj) => (
              <li key={proj.id}>
                <Link
                  to="/projects/$slug"
                  params={{ slug: proj.slug }}
                  className="flex h-full flex-col rounded-2xl border border-black/5 bg-white/70 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-medium">{proj.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {proj.tagline}
                  </p>
                  {proj.category ? (
                    <span className="mt-3 w-fit rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {proj.category}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
