/**
 * Drizzle schema barrel.
 *
 * Combines the better-auth generated tables (regenerate with `bun run
 * auth:generate`) with the Converge domain tables. drizzle-kit reads this file
 * (see drizzle.config.ts) so migrations cover both.
 */
export * from './auth-schema'
export * from './domain-schema'
