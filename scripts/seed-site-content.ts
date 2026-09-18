/**
 * Load the sections, policy pages and shop settings into this database.
 *
 *   npm run seed:site-content
 *
 * Reads scripts/data/site-content.json, which `npm run export:catalogue` wrote
 * from the live shop. Those three are not products, so they have no place in
 * the bulk-upload spreadsheet; this carries them across instead.
 *
 * Run it once on a fresh database, BEFORE the first bulk upload — the upload
 * checks every row's section against the sections that exist, so with none
 * loaded every row would be refused.
 *
 * Safe to re-run: sections and policies are matched on their web address and
 * updated rather than duplicated. Settings is a single record and is simply
 * overwritten with the exported copy.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Doc = Record<string, any>

const file = path.resolve('scripts/data/site-content.json')
const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
  exportedAt: string
  categories: Doc[]
  policies: Doc[]
  settings: Doc
}

const payload = await getPayload({ config })

async function upsert(collection: 'categories' | 'policies', doc: Doc) {
  const found = await payload.find({
    collection,
    where: { slug: { equals: doc.slug } },
    limit: 1,
    depth: 0,
  })
  if (found.docs[0]) {
    await payload.update({ collection, id: found.docs[0].id, data: doc })
    return 'updated'
  }
  await payload.create({ collection, data: doc as never })
  return 'created'
}

console.log(`Loading site content exported ${data.exportedAt}`)

for (const c of data.categories) console.log(`  section  ${c.slug}: ${await upsert('categories', c)}`)
for (const p of data.policies) console.log(`  policy   ${p.slug}: ${await upsert('policies', p)}`)

// globalType is Payload's own bookkeeping, not a field to write back.
const { globalType: _g, ...settings } = data.settings
await payload.updateGlobal({ slug: 'settings', data: settings })
console.log('  settings: updated')

console.log('\nDone. Sections exist now, so the bulk upload can place products in them.')
process.exit(0)
