/**
 * Marks the first migration as already applied.
 *
 *   npm run migrate:baseline
 *
 * This database was built by Payload's dev-mode schema push, so its tables
 * already exist. The initial migration describes exactly those tables, and
 * running it would fail on "relation already exists".
 *
 * Baselining records it as done without executing it, which is the normal
 * way to bring an existing database under migration control. Every
 * migration created after this one runs for real.
 *
 * Run once, against the database that already has the schema. It refuses
 * to do anything if the tables are not actually there.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import { connectionString } from '../src/lib/db-url'

// Schema bookkeeping wants a stable session, so go through the same port
// chooser the rest of the project uses rather than the raw URL.
const client = new pg.Client({ connectionString: connectionString() })
await client.connect()

try {
  // Only baseline a database that genuinely already has the schema.
  const { rows: tables } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'payload' and table_name in ('products','categories','media','users')`,
  )
  if (tables.length < 4) {
    console.error(
      `Refusing to baseline: only ${tables.length} of the 4 core tables exist.\n` +
        'This looks like an empty database — run `npm run migrate` instead, which\n' +
        'will build the schema properly.',
    )
    process.exit(1)
  }

  const dir = path.resolve('src/migrations')
  const names = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort()

  if (names.length === 0) {
    console.error('No migration files found. Run `npx payload migrate:create` first.')
    process.exit(1)
  }

  const { rows: already } = await client.query(
    'select name from payload.payload_migrations where name = any($1)',
    [names],
  )
  const done = new Set(already.map((r) => r.name))
  const todo = names.filter((n) => !done.has(n))

  if (todo.length === 0) {
    console.log('Already baselined. Nothing to do.')
    process.exit(0)
  }

  for (const name of todo) {
    await client.query(
      `insert into payload.payload_migrations (name, batch, updated_at, created_at)
       values ($1, 1, now(), now())`,
      [name],
    )
    console.log(`baselined  ${name}`)
  }

  console.log(
    `\n${todo.length} migration(s) recorded as applied.\n` +
      'From here, `npm run migrate` will run anything new for real.',
  )
} finally {
  await client.end()
}

process.exit(0)
