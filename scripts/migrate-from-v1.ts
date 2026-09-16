/**
 * Carries the live catalogue from the v1 Supabase table into Payload.
 *
 *   npm run migrate
 *
 * Safe to re-run: products are matched on slug and updated, never doubled.
 * v1's product `id` becomes the v2 `slug` verbatim, so every product link
 * already shared on WhatsApp keeps working after the switch.
 *
 * Photos are fetched from the old public bucket and uploaded into Payload,
 * which regenerates the thumbnails. The old bucket is left untouched, so
 * the v1 site keeps running throughout.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import type { Product } from '../src/payload-types'

const V1_URL = process.env.V1_SUPABASE_URL || 'https://wjgcctlzqcjkpqoensuq.supabase.co'
const V1_KEY = process.env.V1_SUPABASE_KEY || 'sb_publishable_kNVH5RUdwtfGlhwfRM06CQ_KlZ2bmUB'

type V1Product = {
  id: string
  name: string
  cluster: string
  cat: string
  price: number
  mrp: number
  stock: number
  occ: string[] | null
  descr: string
  photo: string
  photo2: string
  gen: string
  net: string
  mfr: string
  coo: string
  mm: string
  size: string
  weight: string
  finish: string
  feat: boolean
  short: string
}

/** v1's cluster ids, and the sections they become. */
const SECTIONS: Record<string, { name: string; shortName: string; order: number; blurb: string }> =
  {
    decor: {
      name: 'Home & Décor',
      shortName: 'Decor',
      order: 10,
      blurb: 'Brass idols, diyas, kalash, sculptures and the pieces that make a house festive.',
    },
    bags: {
      name: 'Bags',
      shortName: 'Bags',
      order: 20,
      blurb: 'Totes, handbags and structured carriers for every day and for occasions.',
    },
    jewellery: { name: 'Jewellery', shortName: 'Jewellery', order: 30, blurb: '' },
    shoes: { name: 'Shoes', shortName: 'Shoes', order: 40, blurb: '' },
    watches: { name: 'Watches', shortName: 'Watches', order: 50, blurb: '' },
    gifting: { name: 'Gifting', shortName: 'Gifting', order: 60, blurb: '' },
    lifestyle: { name: 'Lifestyle', shortName: 'Lifestyle', order: 70, blurb: '' },
  }

type Occasion = NonNullable<NonNullable<Product['occasions']>[number]>

/** v1 stored free-text occasions; v2 has a fixed list. */
const OCCASION_MAP: Record<string, Occasion> = {
  birthday: 'birthday',
  birthdays: 'birthday',
  wedding: 'wedding',
  weddings: 'wedding',
  housewarming: 'wedding',
  festival: 'festival',
  festivals: 'festival',
  everyday: 'everyday',
}

async function fetchV1(): Promise<V1Product[]> {
  const res = await fetch(`${V1_URL}/rest/v1/products?select=*&order=name.asc`, {
    headers: { apikey: V1_KEY, Authorization: `Bearer ${V1_KEY}` },
  })
  if (!res.ok) throw new Error(`v1 catalogue returned HTTP ${res.status}`)
  return res.json()
}

async function main() {
  const payload = await getPayload({ config })

  console.log('Reading the v1 catalogue…')
  const rows = await fetchV1()
  console.log(`  ${rows.length} products found.\n`)

  // ── Sections ──────────────────────────────────────────────────────
  const usedClusters = [...new Set(rows.map((r) => r.cluster))]
  const categoryIds = new Map<string, number>()

  for (const cluster of usedClusters) {
    const meta = SECTIONS[cluster] ?? {
      name: cluster.charAt(0).toUpperCase() + cluster.slice(1),
      shortName: cluster.charAt(0).toUpperCase() + cluster.slice(1),
      order: 100,
      blurb: '',
    }
    const subCategories = [
      ...new Set(rows.filter((r) => r.cluster === cluster && r.cat).map((r) => r.cat)),
    ].map((name) => ({ name }))

    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cluster } },
      limit: 1,
    })

    const data = { ...meta, slug: cluster, subCategories }
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'categories', id: existing.docs[0].id, data })
      : await payload.create({ collection: 'categories', data })

    categoryIds.set(cluster, doc.id as number)
    console.log(`Section ${existing.docs[0] ? 'updated' : 'created'}: ${meta.name}`)
  }

  // ── Products ──────────────────────────────────────────────────────
  let created = 0
  let updated = 0
  let photosUploaded = 0

  for (const row of rows) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: row.id } },
      limit: 1,
      depth: 0,
    })

    // Photos are only fetched for products that do not have them yet, so a
    // re-run is quick and does not duplicate media.
    let photoIds: number[] = []
    if (existing.docs[0]) {
      const current = existing.docs[0].photos
      photoIds = Array.isArray(current)
        ? current.map((p) => (typeof p === 'object' ? p.id : p) as number)
        : []
    }

    if (photoIds.length === 0) {
      for (const url of [row.photo, row.photo2].filter(Boolean)) {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const buffer = Buffer.from(await res.arrayBuffer())
          const name = url.split('/').pop() || `${row.id}.jpg`

          const media = await payload.create({
            collection: 'media',
            data: { alt: row.name },
            file: {
              data: buffer,
              name,
              mimetype: res.headers.get('content-type') || 'image/jpeg',
              size: buffer.length,
            },
          })
          photoIds.push(media.id as number)
          photosUploaded++
        } catch (err) {
          console.warn(`  ! photo failed for ${row.name}: ${(err as Error).message}`)
        }
      }
    }

    const occasions = [
      ...new Set(
        (row.occ ?? [])
          .map((o) => OCCASION_MAP[o.toLowerCase()])
          .filter((o): o is Occasion => Boolean(o)),
      ),
    ]

    const data = {
      title: row.name,
      slug: row.id,
      // Everything already selling on v1 is live by definition.
      status: 'live' as const,
      category: categoryIds.get(row.cluster)!,
      subCategory: row.cat || undefined,
      price: Number(row.price) || 0,
      mrp: Number(row.mrp) || Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      description: row.descr || undefined,
      occasions,
      photos: photoIds,
      featured: Boolean(row.feat),
      shortCaption: row.short || undefined,
      genericName: row.gen || undefined,
      netQuantity: row.net || undefined,
      manufacturer: row.mfr || undefined,
      countryOfOrigin: row.coo || undefined,
      monthYearOfImport: row.mm || undefined,
      dimensions: row.size || undefined,
      weight: row.weight || undefined,
      finish: row.finish || undefined,
    }

    if (existing.docs[0]) {
      await payload.update({ collection: 'products', id: existing.docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'products', data })
      created++
    }
    process.stdout.write(`\r  ${created + updated}/${rows.length} products…`)
  }

  console.log(
    `\n\nDone. ${created} created, ${updated} updated, ${photosUploaded} photos uploaded.`,
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
