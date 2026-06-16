import { createFileRoute } from '@tanstack/react-router'

/**
 * Apple App Site Association — authorizes the native Converge iOS app to use
 * passkeys (WebAuthn) scoped to this domain via the Associated Domains
 * capability (`webcredentials:converge.sams.land`).
 *
 * `<TeamID>.<BundleID>` for the app. Served as JSON with no redirect, exactly
 * at `/.well-known/apple-app-site-association`, per Apple's requirements.
 */
const APP_ID = 'Y3734CNKQ8.land.sams.converge'

const body = JSON.stringify({
  webcredentials: { apps: [APP_ID] },
  applinks: { apps: [], details: [] },
})

export const Route = createFileRoute('/.well-known/apple-app-site-association')({
  server: {
    handlers: {
      GET: () =>
        new Response(body, {
          headers: { 'content-type': 'application/json' },
        }),
    },
  },
})
