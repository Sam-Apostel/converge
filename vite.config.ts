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
 *
 * Two things make this reliable:
 *  - `enforce: 'pre'` + being first in the plugin list, so our `resolveId` wins
 *    over TanStack Start / nitro's own resolvers (which otherwise claim `pg`
 *    before we ever get a turn — the reason an earlier version silently failed).
 *  - We stub `#/db` itself (the single chokepoint that imports the driver) in
 *    addition to the `pg` package family, so the client graph never even
 *    reaches the Node-only code. `#/db` is server-only by convention; the
 *    client only ever needs the type-only `#/db/types` and `#/db/schema`.
 */
function stubNodeOnlyPackagesForClient(): Plugin {
  // The Node-only postgres driver family, matched on the bare specifier or any
  // deep import within them (e.g. `pg/lib/...`).
  const STUB_RE =
    /^(pg|pgpass|pg-pool|pg-protocol|pg-types|pg-connection-string|pg-cloudflare|pg-native)(\/.*)?$/
  const isStubbed = (id: string) =>
    id === '#/db' ||
    id === '#/db/index' ||
    id === '#/db/index.ts' ||
    id === 'drizzle-orm/node-postgres' ||
    STUB_RE.test(id)
  const STUB_ID = '\0server-only-stub'

  return {
    name: 'stub-node-only-packages-for-client',
    enforce: 'pre',
    applyToEnvironment(env) {
      return env.name === 'client'
    },
    resolveId(id) {
      // Guard on the environment too, so this can never affect the server build
      // even if `applyToEnvironment` semantics change.
      if (this.environment?.name !== 'client') return
      if (id === STUB_ID || isStubbed(id)) return STUB_ID
    },
    load(id) {
      if (id === STUB_ID) {
        return 'export default {}; export const Pool = class {}; export const drizzle = () => ({}); export const db = {};'
      }
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Must come first: it stubs the server-only db driver in the client env,
    // and needs to resolve `pg` / `#/db` before any other plugin does.
    stubNodeOnlyPackagesForClient(),
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
