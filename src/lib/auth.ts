import { betterAuth } from 'better-auth'
import type { BetterAuthPlugin } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthMiddleware } from 'better-auth/api'
import { mcp } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { passkey } from '@better-auth/passkey'

import { db } from '#/db'
import * as authSchema from '#/db/auth-schema'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const rpID = new URL(baseURL).hostname

/** Custom URL scheme the native iOS app uses for OAuth deep-link callbacks. */
const NATIVE_SCHEME = 'converge://'

/**
 * Native OAuth bridge (mirrors `@better-auth/expo` without the dependency).
 *
 * better-auth is cookie-based, but a native client running an OAuth flow in
 * `ASWebAuthenticationSession` can't read the cookie the web callback sets. So
 * on an OAuth callback that redirects to our trusted custom scheme, append the
 * `Set-Cookie` value as a `?cookie=` param on the deep link; the app extracts
 * it and stores it for subsequent API calls.
 */
const nativeRedirectCookie = {
  id: 'native-redirect-cookie',
  hooks: {
    after: [
      {
        matcher: (context) =>
          Boolean(
            context.path?.startsWith('/callback') ||
              context.path?.startsWith('/oauth2/callback'),
          ),
        handler: createAuthMiddleware(async (ctx) => {
          const headers = ctx.context.responseHeaders
          const location = headers?.get('location')
          const cookie = headers?.get('set-cookie')
          if (!location || !cookie) return
          let redirectURL: URL
          try {
            redirectURL = new URL(location)
          } catch {
            return
          }
          if (!ctx.context.isTrustedOrigin(location)) return
          redirectURL.searchParams.set('cookie', cookie)
          ctx.setHeader('location', redirectURL.toString())
        }),
      },
    ],
  },
} satisfies BetterAuthPlugin

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

  // Trust the native app's custom scheme so OAuth deep-link callbacks are allowed.
  trustedOrigins: [NATIVE_SCHEME, baseURL],

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
    // Bridge OAuth session cookies to the native app's deep-link callback.
    nativeRedirectCookie,
    // Must be the LAST plugin — it wraps cookie handling for the others.
    tanstackStartCookies(),
  ],
})
