import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema.ts'

// Construct the pg Pool explicitly (rather than passing a connection string to
// drizzle) so drizzle never does its own dynamic `require('pg')`. That require
// fails when bun resolves drizzle-orm from its global cache while running a
// raw script (e.g. `bun run db:seed`): "Cannot find package 'pg'".
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool, { schema })
