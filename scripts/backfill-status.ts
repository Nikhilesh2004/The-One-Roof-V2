/**
 * Publishes products that predate the draft/live workflow.
 *
 *   npm run backfill:status -- --promote-drafts
 *
 * When the status field was added, Postgres applied its column default to
 * every existing row, so all 25 products carried over from v1 became
 * drafts at once and the storefront went blank. This puts them back.
 *
 * It will not promote anything unless `--promote-drafts` is passed, and it
 * refuses to run at all once real drafts exist alongside published
 * products — after the first shoot, a draft is a deliberate decision and
 * a script that publishes drafts in bulk is a script that will one day put
 * an unfinished listing in front of a customer.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const promote = process.argv.includes('--promote-drafts')

const payload = await getPayload({ config })
const { docs, totalDocs } = await payload.find({ collection: 'products', limit: 2000, depth: 0 })

const drafts = docs.filter((p) => p.status === 'draft')
const live = docs.filter((p) => p.status === 'live')
const hidden = docs.filter((p) => p.status === 'hidden')

console.log(
  `${totalDocs} products: ${live.length} live, ${drafts.length} draft, ${hidden.length} hidden.\n`,
)

if (drafts.length === 0) {
  console.log('No drafts. Nothing to do.')
  process.exit(0)
}

if (!promote) {
  console.log('Drafts found, but nothing was changed.')
  console.log('If these are products that should already be on the website, re-run with:\n')
  console.log('  npm run backfill:status -- --promote-drafts\n')
  process.exit(0)
}

// The guard: once the shop has both published products and drafts, a draft
// means someone chose not to publish it yet.
if (live.length > 0) {
  console.error('Refusing to run.\n')
  console.error(
    `There are already ${live.length} live products, so these ${drafts.length} drafts are\n` +
      'deliberate — publishing them in bulk would put unfinished listings on the\n' +
      'website. Publish them one at a time from the admin instead.',
  )
  process.exit(1)
}

console.log(`Publishing ${drafts.length} drafts…`)
let done = 0
for (const p of drafts) {
  await payload.update({
    collection: 'products',
    id: p.id,
    data: { status: 'live', publishedAt: p.publishedAt ?? p.createdAt },
  })
  done++
  process.stdout.write(`\r  ${done}/${drafts.length}`)
}

const after = await payload.count({ collection: 'products', where: { status: { equals: 'live' } } })
console.log(`\n\nDone. ${after.totalDocs} products are live.`)
process.exit(0)
