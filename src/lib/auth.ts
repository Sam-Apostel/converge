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
 * Sign-in methods: email + password, GitHub, LinkedIn (OIDC), and passkeys.
 */
export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID ?? '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      // LinkedIn's `email` claim is optional under OIDC; fall back so a missing
      // email never violates the NOT NULL / unique constraint on `user.email`.
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.sub}@linkedin.local`,
        name: profile.name,
        image: profile.picture,
      }),
    },
  },

  // One person may sign in with GitHub, LinkedIn, a passkey and a password.
  // Link them all to a single `user` row by verified email.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'linkedin'],
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

export type Session = typeof auth.$Infer.Session
