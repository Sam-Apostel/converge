import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { mcp } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { passkey } from '@better-auth/passkey'

import { db } from '#/db'
import * as authSchema from '#/db/auth-schema'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const rpID = new URL(baseURL).hostname

/**
 * Converge authentication.
 *
 * better-auth is configured as both the app's auth provider *and* the OAuth 2.1
 * authorization server for the MCP platform (via the `mcp` plugin). That lets
 * external AI agents obtain tokens and call `/mcp` on behalf of a signed-in user
 * while sharing the same Postgres database and session model as the web app.
 *
 * Sign-in methods: email + password, GitHub, and passkeys.
 */
export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),

  emailAndPassword: {
    enabled: true,
  },

  // Global super-admin flag. `input: false` keeps it out of the signup/update
  // API surface — it is granted out-of-band (seed / SQL) and read server-side to
  // gate the admin MCP tools. Regenerate `auth-schema.ts` with `auth:generate`.
  user: {
    additionalFields: {
      isAdmin: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },

  // One person may sign in with GitHub, a passkey and a password.
  // Link them all to a single `user` row by verified email.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github'],
    },
  },

  plugins: [
    passkey({
      rpID,
      rpName: 'Converge',
      origin: baseURL,
    }),
    // Turns better-auth into an OAuth 2.1 / OIDC authorization server for MCP.
    // Unauthenticated agents are sent to the app's login page.
    mcp({
      loginPage: '/login',
    }),
    // Must be the LAST plugin — it wraps cookie handling for the others.
    tanstackStartCookies(),
  ],
})
