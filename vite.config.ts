import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

/**
 * Stub Node.js-only packages for the client environment.
 *
 * The `createServerFn` Vite plugin analyzes server-function files by loading
 * their dependency graph through the client environment. If a dependency (like
 * `pg`) uses Node.js APIs at module-init time (Buffer.from in pg-protocol's
 * serializer), the analysis crashes and the server function is never stripped
 * from the client bundle — causing a "Buffer is not defined" runtime error.
 *
 * Returning empty stubs here lets the plugin finish its transformation so that
 * dead-code elimination properly removes `import { db } from '#/db'` from the
 * client bundle.
 */
function stubNodeOnlyPackagesForClient(): Plugin {
  const STUB_PACKAGES = new Set([
    'pg',
    'pg-protocol',
    'pg-types',
    'pg-connection-string',
    'pgpass',
    'drizzle-orm/node-postgres',
  ])
  const STUB_ID = '\0server-only-stub'

  return {
    name: 'stub-node-only-packages-for-client',
    applyToEnvironment(env) {
      return env.name === 'client'
    },
    resolveId(id) {
      const base = id.split('/').slice(0, 2).join('/')
      if (STUB_PACKAGES.has(id) || STUB_PACKAGES.has(base)) {
        return STUB_ID
      }
    },
    load(id) {
      if (id === STUB_ID) return 'export default {}; export const Pool = class {};'
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    stubNodeOnlyPackagesForClient(),
  ],
})

export default config
