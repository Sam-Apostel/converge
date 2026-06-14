import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { ProjectForm, type ProjectFormValues } from '#/components/project-form'
import { Mono } from '#/components/ui'
import { useSession } from '#/lib/auth-client'
import { getProjectBySlug } from '#/lib/queries/profiles'
import type { Project } from '#/db/types'

export const Route = createFileRoute('/_app/projects/$slug/edit')({
  loader: ({ params }) => getProjectBySlug({ data: params.slug }),
  component: EditProjectPage,
})

function EditProjectPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const { data: session } = useSession()

  if (!data) return <NotAllowed reason="That project isn't here." />
  const { project } = data

  // Only the owner may edit. (The PATCH endpoint enforces this server-side too.)
  if (session?.user && session.user.id !== project.ownerId) {
    return <NotAllowed reason="You can only edit projects you own." />
  }

  const handleSubmit = async (values: ProjectFormValues) => {
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: project.id,
        ...values,
        screenshots: values.screenshotUrl ? [values.screenshotUrl] : [],
      }),
    })
    if (res.status === 401) throw new Error('Sign in to edit this project.')
    if (res.status === 403) throw new Error('You can only edit your own project.')
    if (!res.ok) throw new Error((await res.text()) || 'Something went wrong.')
    const updated = (await res.json()) as Project
    await navigate({ to: '/projects/$slug', params: { slug: updated.slug } })
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        className="mb-5 inline-flex items-center gap-1 text-note text-mist transition-colors hover:text-slate"
      >
        <ChevronLeft size={15} /> {project.name}
      </Link>

      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Edit {project.name}
      </h1>
      <p className="mb-6 mt-1 text-body text-mist">
        Keep your project page current — update the pitch, stack and what you're
        looking for.
      </p>

      <ProjectForm
        initial={{
          name: project.name,
          tagline: project.tagline ?? '',
          description: project.description ?? '',
          category: project.category ?? 'side-project',
          techStack: project.techStack ?? [],
          lookingFor: project.lookingFor ?? [],
          links: project.links ?? {},
          screenshotUrl: project.screenshots?.[0] ?? null,
        }}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function NotAllowed({ reason }: { reason: string }) {
  return (
    <div className="py-20 text-center">
      <Mono tone="ghost" className="!text-caption !tracking-[0.04em]">
        Can't edit
      </Mono>
      <p className="mt-3 text-body text-mist">
        {reason}{' '}
        <Link to="/projects" className="text-slate underline">
          Back to projects
        </Link>
        .
      </p>
    </div>
  )
}
