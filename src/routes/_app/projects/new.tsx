import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import {
  ProjectForm,
  emptyProjectForm,
  type ProjectFormValues,
} from '#/components/project-form'
import type { Project } from '#/db/types'

export const Route = createFileRoute('/_app/projects/new')({
  component: RegisterProjectPage,
})

function RegisterProjectPage() {
  const navigate = useNavigate()

  const handleSubmit = async (values: ProjectFormValues) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...values,
        screenshots: values.screenshotUrl ? [values.screenshotUrl] : [],
      }),
    })
    if (res.status === 401) throw new Error('Sign in to register a project.')
    if (!res.ok) throw new Error((await res.text()) || 'Something went wrong.')
    const project = (await res.json()) as Project
    await navigate({ to: '/projects/$slug', params: { slug: project.slug } })
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/projects"
        className="mb-5 inline-flex items-center gap-1 text-note text-mist transition-colors hover:text-slate"
      >
        <ChevronLeft size={15} /> Projects
      </Link>

      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Register your project
      </h1>
      <p className="mb-6 mt-1 text-body text-mist">
        Put what you're building on the showcase — people connect over projects,
        not job titles.
      </p>

      <ProjectForm
        initial={emptyProjectForm}
        submitLabel="Register project"
        submittingLabel="Registering…"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
