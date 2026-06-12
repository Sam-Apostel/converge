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
 *
 * The same treatment covers the concierge crypto module
 * (`src/lib/concierge/crypto.ts`), which imports `node:crypto` and is reached
 * through the `createServerFn` files in `src/lib/concierge/settings.ts` /
 * `provider.ts`. Stubbing that chokepoint keeps `crypto.ts` out of the client
 * graph entirely, so `node:crypto` is never externalized through it — which
 * previously surfaced as "Cannot access node:crypto.createCipheriv in client
 * code" at runtime. We deliberately do NOT stub the `node:crypto` builtin
 * itself: unrelated packages (e.g. `@anthropic-ai/sdk`) import it and rely on
 * Vite's normal externalization.
 */
function stubNodeOnlyPackagesForClient(): Plugin {
  // The Node-only postgres driver family, matched on the bare specifier or any
  // deep import within them (e.g. `pg/lib/...`).
  const STUB_RE =
    /^(pg|pgpass|pg-pool|pg-protocol|pg-types|pg-connection-string|pg-cloudflare|pg-native)(\/.*)?$/
  // The server-only concierge crypto chokepoint, matched on its alias or any
  // resolved path ending (the in-tree importers reference it as `./crypto`).
  const isCryptoModule = (id: string) =>
    id === '#/lib/concierge/crypto' ||
    /(^|\/)lib\/concierge\/crypto(\.[tj]sx?)?$/.test(id)
  const isStubbed = (id: string) =>
    id === '#/db' ||
    id === '#/db/index' ||
    id === '#/db/index.ts' ||
    id === 'drizzle-orm/node-postgres' ||
    isCryptoModule(id) ||
    STUB_RE.test(id)
  const STUB_ID = '\0server-only-stub'

  return {
    name: 'stub-node-only-packages-for-client',
    enforce: 'pre',
    applyToEnvironment(env) {
      return env.name === 'client'
    },
    async resolveId(id, importer) {
      // Guard on the environment too, so this can never affect the server build
      // even if `applyToEnvironment` semantics change.
      if (this.environment?.name !== 'client') return
      if (id === STUB_ID || isStubbed(id)) return STUB_ID
      // Relative imports (e.g. settings.ts -> `./crypto`) only reveal the
      // chokepoint after resolution, so resolve and re-check against the path.
      if (importer && id.startsWith('.')) {
        const resolved = await this.resolve(id, importer, { skipSelf: true })
        if (resolved && isCryptoModule(resolved.id)) return STUB_ID
      }
    },
    load(id) {
      if (id === STUB_ID) {
        return [
          'export default {};',
          'export const Pool = class {};',
          'export const drizzle = () => ({});',
          'export const db = {};',
          // node:crypto / concierge crypto named exports (server-only; these are
          // only ever invoked inside stripped server-fn handlers).
          'const unavailable = () => { throw new Error("crypto is server-only"); };',
          'export const createCipheriv = unavailable;',
          'export const createDecipheriv = unavailable;',
          'export const randomBytes = unavailable;',
          'export const scryptSync = unavailable;',
          'export const encrypt = unavailable;',
          'export const decrypt = unavailable;',
        ].join('\n')
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
