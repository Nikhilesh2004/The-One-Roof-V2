/**
 * Which Supabase pooler the process should talk to.
 *
 * Supabase serves the same database on two ports and the choice is not
 * cosmetic:
 *
 *   5432 — session mode. One real Postgres connection per client, hard-capped
 *          at 15. Right for a script that runs once and exits.
 *   6543 — transaction mode. Connections go back to the pool between
 *          statements, so many callers share a few. Right for serverless.
 *
 * A Vercel function is frozen between requests: it keeps its pool open and
 * its idle timer never fires. On 5432 four warm instances take the entire
 * cap, the site starts erroring, and the next deploy cannot even run
 * `payload migrate` — which is exactly how the build failed on 2026-09-06
 * with EMAXCONNSESSION.
 *
 * So the app runs on 6543, and anything that wants a stable session — a
 * migration above all — asks for 5432 with DATABASE_SESSION_MODE=true.
 * Both are derived from the one DATABASE_URL, so there is still a single
 * secret to keep in step.
 */
export function connectionString(): string {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    // Only Supabase's pooler has the two ports; leave any other host alone.
    if (!url.hostname.endsWith('pooler.supabase.com')) return raw
    url.port = process.env.DATABASE_SESSION_MODE === 'true' ? '5432' : '6543'
    return url.toString()
  } catch {
    return raw
  }
}

/** The pooler this process will use, safe to print — host and port only. */
export function connectionLabel(): string {
  const s = connectionString()
  if (!s) return 'no DATABASE_URL set'
  try {
    const url = new URL(s)
    const mode = url.port === '6543' ? 'transaction' : url.port === '5432' ? 'session' : 'other'
    return `${url.hostname}:${url.port} (${mode} mode)`
  } catch {
    return 'unparseable DATABASE_URL'
  }
}
