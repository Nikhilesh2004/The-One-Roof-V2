/**
 * Proves the app can actually talk to Supabase through the transaction
 * pooler (port 6543) before a deploy depends on it.
 *
 *   npm run check:pooler
 *
 * Transaction pooling hands a different backend to each statement, which is
 * where ORMs come unstuck: a named prepared statement created on one backend
 * does not exist on the next, and the classic symptom is
 * `prepared statement "s1" already exists` under repetition. So this does not
 * just open a connection — it runs the same query shapes the storefront and
 * the admin use, repeatedly and in parallel, which is the only way that fault
 * shows itself.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { connectionLabel } from '../src/lib/db-url'

console.log(`Talking to ${connectionLabel()}`)

const payload = await getPayload({ config })
console.log('connected\n')

let failures = 0
const step = async (name: string, fn: () => Promise<string>) => {
  try {
    console.log(`  ok   ${name} — ${await fn()}`)
  } catch (err) {
    failures++
    console.log(`  FAIL ${name} — ${(err as Error).message}`)
  }
}

// Repeat a find many times: a prepared-statement clash needs repetition.
await step('20x product find (live filter)', async () => {
  for (let i = 0; i < 20; i++) {
    await payload.find({
      collection: 'products',
      where: { status: { equals: 'live' } },
      limit: 12,
      depth: 1,
    })
  }
  const r = await payload.find({ collection: 'products', where: { status: { equals: 'live' } }, limit: 0 })
  return `${r.totalDocs} live`
})

// Parallel, because that is what a burst of visitors looks like.
await step('12 parallel mixed reads', async () => {
  const out = await Promise.all([
    ...Array.from({ length: 6 }, () => payload.find({ collection: 'products', limit: 5, depth: 1 })),
    ...Array.from({ length: 3 }, () => payload.find({ collection: 'categories', limit: 20 })),
    ...Array.from({ length: 3 }, () => payload.find({ collection: 'policies', limit: 10 })),
  ])
  return `${out.length} queries returned`
})

await step('global read', async () => {
  const s = await payload.findGlobal({ slug: 'settings' })
  return `settings id ${s.id ?? '—'}`
})

await step('write in a transaction (create + delete)', async () => {
  // A throwaway section, not a product: Payload wraps a create in a
  // transaction, which is the part transaction pooling can break, and a
  // section needs no photos to exist. It is removed again immediately.
  const doc = await payload.create({
    collection: 'categories',
    data: { name: 'pooler check — delete me', shortName: 'poolercheck', order: 9999 },
  })
  await payload.delete({ collection: 'categories', id: doc.id })
  return `created ${doc.id}, removed again`
})

await step('count by status', async () => {
  const out: string[] = []
  for (const status of ['live', 'draft', 'hidden'] as const) {
    const r = await payload.find({ collection: 'products', where: { status: { equals: status } }, limit: 0 })
    out.push(`${status} ${r.totalDocs}`)
  }
  return out.join(' · ')
})

console.log(failures === 0 ? '\nAll good on this pooler.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
