/**
 * Export a shop's products into the bulk-upload format.
 *
 *   npm run export:catalogue -- <output folder>
 *   EXPORT_FROM=https://some-other-host npm run export:catalogue -- <folder>
 *
 * Writes, into the output folder:
 *
 *   products.json     one entry per product, in the template's column order
 *   photos/           every product photo, renamed <slug>-01.jpg, <slug>-02.jpg …
 *
 * then `python scripts/build-template.py <folder>/products.json <out.xlsx>`
 * turns products.json into the spreadsheet Bulk upload takes.
 *
 * It reads the site's public API over HTTPS — the same data any visitor can
 * see — so it needs no database access and no credentials, and works against
 * whichever host EXPORT_FROM names. That is how the shop moved off Supabase:
 * exported from the old site, re-imported into the new one through Bulk
 * upload, so the importer was proven on real data first.
 *
 * Products only. Sections, policy pages and shop settings live in
 * scripts/data/site-content.json, which is kept by hand — it carries fixes the
 * old site never had (the Privacy Policy's hosting sentence), and re-exporting
 * it would quietly put them back. `npm run seed:site-content` loads it.
 *
 * Photos come down at the `full` size (1600px) where one exists, and the
 * original otherwise: the largest the site ever shows, and it keeps 6.8 MB
 * phone originals out of the new shop. Bulk upload regenerates every smaller
 * size from it.
 */
import fs from 'fs'
import path from 'path'

const SITE = (process.env.EXPORT_FROM || 'https://www.theoneroof.co').replace(/\/$/, '')
const out = path.resolve(process.argv[2] || 'theoneroof-export')
const photosDir = path.join(out, 'photos')
fs.mkdirSync(photosDir, { recursive: true })

type Sized = { url?: string | null }
type Media = { url?: string | null; filename?: string | null; sizes?: { full?: Sized } | null }
type Doc = Record<string, any>

const extOf = (name: string) => (path.extname(name) || '.jpg').toLowerCase()

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(`${SITE}${url}`)
  if (!res.ok) throw new Error(`${res.status} from ${SITE}${url}`)
  return (await res.json()) as T
}

async function download(url: string, dest: string) {
  const res = await fetch(new URL(url, SITE))
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

const { docs: products } = await getJson<{ docs: Doc[] }>(
  '/api/products?pagination=false&depth=1&sort=id',
)

const rows: Doc[] = []
let fetched = 0
const failed: string[] = []

for (const p of products) {
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

  const row: Doc = {
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

console.log(`from:     ${SITE}`)
console.log(`products: ${rows.length}`)
console.log(`photos:   ${fetched} downloaded into ${photosDir}`)
if (failed.length) {
  console.log(`\nPROBLEMS (${failed.length}):`)
  failed.forEach((f) => console.log('  ' + f))
}
