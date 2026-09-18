/**
 * Export the live shop into the bulk-upload format.
 *
 *   npm run export:catalogue -- <output folder>
 *
 * Writes, into the output folder:
 *
 *   products.json     one entry per product, in the template's column order
 *   photos/           every product photo, renamed <slug>-01.jpg, <slug>-02.jpg …
 *
 * and, into the repo, scripts/data/site-content.json — the sections, policy
 * pages and shop settings, which are not products and so have no place in the
 * spreadsheet. `npm run seed:site-content` loads that file into a fresh
 * database.
 *
 * This is how the shop moves off Supabase: rather than copying the database,
 * it is re-imported through the same bulk upload the team will use for the
 * next thousand products, so the importer is proven on real data first.
 *
 * Photos are downloaded at the `full` size (1600px) where Payload made one,
 * and the original otherwise. That is the largest size the site ever shows,
 * and it is what drops the 6.8 MB phone originals to something sane — the
 * importer regenerates every smaller size from it.
 *
 * Read-only against the database. Writes only to the output folder and the
 * one JSON file.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SITE = process.env.EXPORT_FROM || 'https://www.theoneroof.co'
const out = path.resolve(process.argv[2] || 'theoneroof-export')
const photosDir = path.join(out, 'photos')
fs.mkdirSync(photosDir, { recursive: true })

type Sized = { url?: string | null }
type Media = { url?: string | null; filename?: string | null; sizes?: { full?: Sized } | null }

const extOf = (name: string) => (path.extname(name) || '.jpg').toLowerCase()

async function download(url: string, dest: string) {
  const res = await fetch(new URL(url, SITE))
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

const strip = <T extends Record<string, unknown>>(doc: T) => {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = doc
  return rest
}

const payload = await getPayload({ config })

const { docs: products } = await payload.find({
  collection: 'products',
  depth: 1,
  limit: 10000,
  sort: 'id',
  pagination: false,
})

const rows: Record<string, unknown>[] = []
let fetched = 0
const failed: string[] = []

for (const p of products as Record<string, any>[]) {
  const photos: string[] = []
  const media = (Array.isArray(p.photos) ? p.photos : []) as Media[]

  for (const [i, m] of media.entries()) {
    const src = m?.sizes?.full?.url || m?.url
    if (!src) continue
    const name = `${p.slug}-${String(i + 1).padStart(2, '0')}${extOf(m.filename || src)}`
    try {
      await download(src, path.join(photosDir, name))
      photos.push(name)
      fetched++
    } catch (e) {
      failed.push(`${p.slug} photo ${i + 1}: ${(e as Error).message}`)
    }
  }

  const row: Record<string, unknown> = {
    title: p.title,
    slug: p.slug,
    thumbnail: '',
    price: p.price ?? '',
    mrp: p.mrp ?? '',
    stock: p.stock ?? 0,
    category: typeof p.category === 'object' && p.category ? p.category.slug : '',
    subCategory: p.subCategory ?? '',
    description: p.description ?? '',
    occasions: Array.isArray(p.occasions) ? p.occasions.join(';') : '',
    countryOfOrigin: p.countryOfOrigin ?? '',
    manufacturer: p.manufacturer ?? '',
    genericName: p.genericName ?? '',
    netQuantity: p.netQuantity ?? '',
    dimensions: p.dimensions ?? '',
    weight: p.weight ?? '',
    finish: p.finish ?? '',
    monthYearOfImport: p.monthYearOfImport ?? '',
    status: p.status ?? 'draft',
    featured: p.featured ? 'yes' : 'no',
    shortCaption: p.shortCaption ?? '',
    shortSticker: p.shortSticker ?? '',
  }
  photos.slice(0, 6).forEach((f, i) => (row[`photo_${i + 1}`] = f))
  if (photos.length > 6) failed.push(`${p.slug}: has ${photos.length} photos, template holds 6`)
  rows.push(row)
}

fs.writeFileSync(path.join(out, 'products.json'), JSON.stringify(rows, null, 2))

// Sections, policy pages and shop settings: not products, so not in the sheet.
const categories = await payload.find({ collection: 'categories', limit: 1000, pagination: false, sort: 'order' })
const policies = await payload.find({ collection: 'policies', limit: 1000, pagination: false, sort: 'order' })
const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

const contentFile = path.resolve('scripts/data/site-content.json')
fs.mkdirSync(path.dirname(contentFile), { recursive: true })
fs.writeFileSync(
  contentFile,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      categories: categories.docs.map((d) => strip(d as unknown as Record<string, unknown>)),
      policies: policies.docs.map((d) => strip(d as unknown as Record<string, unknown>)),
      settings: strip(settings as unknown as Record<string, unknown>),
    },
    null,
    2,
  ),
)

console.log(`products: ${rows.length}`)
console.log(`photos:   ${fetched} downloaded into ${photosDir}`)
console.log(`sections: ${categories.docs.length}, policies: ${policies.docs.length}, settings: 1`)
console.log(`site content -> ${contentFile}`)
if (failed.length) {
  console.log(`\nPROBLEMS (${failed.length}):`)
  failed.forEach((f) => console.log('  ' + f))
}
process.exit(0)
