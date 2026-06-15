import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'

import { PageHeader } from '#/components/page-header'
import { Button } from '#/components/ui'
import { cn } from '#/lib/utils'
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  providerHasModelList,
  providerNeedsKey,
} from '#/lib/concierge/provider'
import type { ProviderId } from '#/lib/concierge/provider'
import {
  getAiSettings,
  saveAiSettings,
  testAiConnection,
} from '#/lib/concierge/settings'
import type { AiSettingsView } from '#/lib/concierge/settings'

export const Route = createFileRoute('/_app/settings')({
  loader: () => getAiSettings(),
  component: SettingsPage,
})

const MODEL_HINTS: Record<ProviderId, string> = {
  ollama: 'e.g. llama3.1 (leave blank for the dev default)',
  openai: 'e.g. gpt-5.4',
  anthropic: 'e.g. claude-sonnet-4-6',
  openrouter: 'e.g. anthropic/claude-sonnet-4',
}

const MODEL_GUIDANCE: Record<ProviderId, { title: string; lines: string[] }> = {
  ollama: {
    title: 'Picking a local model',
    lines: [
      'Enter the exact tag you pulled with `ollama pull`, e.g. `llama3.1`.',
      'Leave it blank to fall back to the dev default.',
      'Bigger models answer better but need more RAM/VRAM — start with an 8B model and size up.',
    ],
  },
  anthropic: {
    title: 'Picking an Anthropic model',
    lines: [
      'Opus is the most capable — best for nuanced, multi-step concierge replies.',
      'Sonnet is the balanced default: fast and strong for everyday use.',
      'Haiku is the cheapest and fastest — great for simple, high-volume queries.',
    ],
  },
  openai: {
    title: 'Picking an OpenAI model',
    lines: [
      'The flagship GPT model gives the highest quality answers.',
      'The `mini` variants are cheaper and faster with a small quality trade-off.',
      'When in doubt, start with the recommended (top) option and adjust on cost.',
    ],
  },
  openrouter: {
    title: 'Picking an OpenRouter model',
    lines: [
      'Models are namespaced as `vendor/model` (e.g. `anthropic/claude-sonnet-4-6`).',
      'Pick a frontier model for quality, or an open model like Llama to cut costs.',
      'Your OpenRouter key must have access to the model you choose.',
    ],
  },
}

type TestState =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string }

function SettingsPage() {
  const initial = Route.useLoaderData()

  const [provider, setProvider] = useState<ProviderId>(initial.provider)
  const [model, setModel] = useState(initial.model ?? '')
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl ?? '')
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(initial.hasKey)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [test, setTest] = useState<TestState>({ kind: 'idle' })

  const needsKey = providerNeedsKey(provider)

  // Online providers offer a curated model dropdown; preserve an already-saved
  // model that isn't in the list so we never silently drop the user's choice.
  const modelOptions = providerHasModelList(provider)
    ? model && !PROVIDER_MODELS[provider].includes(model)
      ? [model, ...PROVIDER_MODELS[provider]]
      : PROVIDER_MODELS[provider]
    : []

  const handleProviderChange = (next: ProviderId) => {
    setProvider(next)
    setTest({ kind: 'idle' })
    // Land on a valid selection for the new provider's dropdown. Keep the
    // current value if it's still valid; otherwise pick the recommended model.
    if (providerHasModelList(next) && !PROVIDER_MODELS[next].includes(model)) {
      setModel(PROVIDER_MODELS[next][0])
    }
  }

  const applyView = (view: AiSettingsView) => {
    setProvider(view.provider)
    setModel(view.model ?? '')
    setBaseUrl(view.baseUrl ?? '')
    setHasKey(view.hasKey)
    setApiKey('')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const view = await saveAiSettings({
        data: { provider, model, apiKey: apiKey || undefined, baseUrl },
      })
      applyView(view)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleClearKey = async () => {
    setSaving(true)
    try {
      const view = await saveAiSettings({
        data: { provider, model, baseUrl, clearKey: true },
      })
      applyView(view)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTest({ kind: 'testing' })
    const result = await testAiConnection({
      data: { provider, model, apiKey: apiKey || undefined, baseUrl },
    })
    setTest(
      result.ok
        ? { kind: 'ok' }
        : { kind: 'error', message: result.error ?? 'Connection failed' },
    )
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Choose the AI model that powers your concierge. Use a local Ollama server for free, or bring your own provider key."
      />

      <div className="max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-card">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
          className="flex flex-col gap-5"
        >
          {/* provider */}
          <label className="flex flex-col gap-1.5">
            <span className="text-note font-medium text-slate">Provider</span>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
              className={cn(
                'px-3.5 py-2.5 text-body text-ink',
                'rounded-xl border border-line bg-inner',
                'focus:outline-none focus:ring-2 focus:ring-lime/40',
              )}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          {/* model */}
          <label className="flex flex-col gap-1.5">
            <span className="text-note font-medium text-slate">Model</span>
            {providerHasModelList(provider) ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={cn(
                  'px-3.5 py-2.5 text-body text-ink',
                  'rounded-xl border border-line bg-inner',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40',
                )}
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={MODEL_HINTS[provider]}
                className={cn(
                  'px-3.5 py-2.5 text-body text-ink placeholder:text-muted',
                  'rounded-xl border border-line bg-inner',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40',
                )}
              />
            )}
          </label>

          {/* api key — write-only */}
          {needsKey ? (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-note font-medium text-slate">
                API key
                {hasKey ? (
                  <span className="inline-flex items-center gap-1 font-mono text-tiny text-lime-deep">
                    <Check size={12} strokeWidth={2.5} /> key set
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasKey ? 'Enter a new key to replace the stored one' : 'sk-…'
                }
                autoComplete="off"
                className={cn(
                  'px-3.5 py-2.5 text-body text-ink placeholder:text-muted',
                  'rounded-xl border border-line bg-inner',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40',
                )}
              />
              <span className="text-caption text-muted">
                Keys are encrypted at rest and never shown again.
                {hasKey ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => void handleClearKey()}
                      className="font-medium text-ink underline"
                    >
                      Remove stored key
                    </button>
                  </>
                ) : null}
              </span>
            </label>
          ) : null}

          {/* base url — relevant for ollama */}
          {provider === 'ollama' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-note font-medium text-slate">
                Base URL <span className="text-muted">(optional)</span>
              </span>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className={cn(
                  'px-3.5 py-2.5 text-body text-ink placeholder:text-muted',
                  'rounded-xl border border-line bg-inner',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40',
                )}
              />
            </label>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="dark" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={() => void handleTest()}
              disabled={test.kind === 'testing'}
            >
              {test.kind === 'testing' ? 'Testing…' : 'Test connection'}
            </Button>

            {saved ? (
              <span className="text-note font-medium text-lime-deep">
                Saved
              </span>
            ) : null}
            {test.kind === 'ok' ? (
              <span className="inline-flex items-center gap-1 text-note font-medium text-lime-deep">
                <Check size={14} strokeWidth={2.5} /> Connected
              </span>
            ) : null}
            {test.kind === 'error' ? (
              <span className="inline-flex items-center gap-1 text-note text-slate">
                <X size={14} strokeWidth={2.5} /> {test.message}
              </span>
            ) : null}
          </div>
        </form>
      </div>

      {/* model guidance */}
      <div className="mt-4 max-w-xl rounded-2xl border border-line bg-inner p-5">
        <h2 className="text-note font-medium text-ink">
          {MODEL_GUIDANCE[provider].title}
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {MODEL_GUIDANCE[provider].lines.map((line) => (
            <li
              key={line}
              className="flex gap-2 text-caption leading-body text-slate"
            >
              <span aria-hidden className="text-muted">
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
