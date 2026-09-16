/**
 * Pulls the photos v1 is serving *right now* into v2.
 *
 *   npm run refresh:photos            # report only, changes nothing
 *   npm run refresh:photos -- --apply # actually replace them
 *
 * The first migration copied whatever v1 held on the day it ran. Photos
 * reshot in the shop after that never reached v2, so the catalogue here
 * can be showing pictures the live site replaced weeks ago. This compares
 * the two and brings v2 up to date.
 *
 * Replaced photos are deleted from v2's own library afterwards, so the
 * media list does not fill with images nothing points at. Nothing in v1's
 * Supabase bucket is touched — that bucket is still serving the live site.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { SHOP_BACKGROUND_SETTINGS, enhance } from '../src/lib/enhance'

const V1_URL = process.env.V1_SUPABASE_URL || 'https://wjgcctlzqcjkpqoensuq.supabase.co'
const V1_KEY = process.env.V1_SUPABASE_KEY || 'sb_publishable_kNVH5RUdwtfGlhwfRM06CQ_KlZ2bmUB'

const apply = process.argv.includes('--apply')

/* The shop shots already have their background blurred by the phone's
   portrait mode, so blurring again would only soften what is already soft.
   The crop is what matters: every photo the same 4:5, so the grid lines up. */
const SETTINGS = { ...SHOP_BACKGROUND_SETTINGS, backgroundBlur: 0 }

const fileOf = (url: string) => (url || '').split('/').pop() ?? ''
const stem = (name: string) => name.replace(/\.[^.]+$/, '')

async function main() {
  const payload = await getPayload({ config })

  const rows: { id: string; name: string; photo: string; photo2: string }[] = await (
    await fetch(`${V1_URL}/rest/v1/products?select=id,name,photo,photo2&order=name.asc`, {
      headers: { apikey: V1_KEY, Authorization: `Bearer ${V1_KEY}` },
    })
  ).json()

  const { docs } = await payload.find({ collection: 'products', limit: 500, depth: 1 })

  const behind: { row: (typeof rows)[number]; product: (typeof docs)[number]; wanted: string[] }[] = []

  for (const row of rows) {
    const wanted = [row.photo, row.photo2].filter(Boolean)
    const product = docs.find((d) => d.slug === row.id)
    if (!product) continue

    const have = (Array.isArray(product.photos) ? product.photos : [])
      .map((p) => (typeof p === 'object' && p ? (p.filename ?? '') : ''))
      .filter(Boolean)

    // v2 renames on import but keeps the original timestamp prefix.
    const missing = wanted.filter(
      (u) => !have.some((h) => stem(h).startsWith(stem(fileOf(u)).slice(0, 13))),
    )
    if (missing.length) behind.push({ row, product, wanted })
  }

  console.log(`${rows.length} products on v1 · ${behind.length} behind in v2\n`)

  if (behind.length === 0) {
    console.log('Everything is current. Nothing to do.')
    process.exit(0)
  }

  for (const b of behind) console.log(`  ${b.row.name}`)

  if (!apply) {
    console.log('\nNothing was changed. To replace these, run:')
    console.log('  npm run refresh:photos -- --apply\n')
    process.exit(0)
  }

  console.log('\nReplacing…\n')
  let replaced = 0
  let removed = 0
  const problems: string[] = []

  for (const { row, product, wanted } of behind) {
    try {
      const oldIds = (Array.isArray(product.photos) ? product.photos : [])
        .map((p) => (typeof p === 'object' && p ? p.id : p))
        .filter(Boolean) as number[]

      const freshIds: number[] = []
      for (const [i, url] of wanted.entries()) {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${fileOf(url)}`)
        const original = Buffer.from(await res.arrayBuffer())
        const processed = await enhance(original, SETTINGS)

        const media = await payload.create({
          collection: 'media',
          data: { alt: row.name },
          file: {
            data: processed.buffer,
            name: `${stem(fileOf(url))}-${i}.jpg`,
            mimetype: 'image/jpeg',
            size: processed.bytes,
          },
        })
        freshIds.push(media.id as number)
      }

      await payload.update({
        collection: 'products',
        id: product.id,
        data: { photos: freshIds },
      })

      // Only once the product points at the new ones.
      for (const id of oldIds) {
        try {
          await payload.delete({ collection: 'media', id })
          removed++
        } catch {
          /* still referenced somewhere; leaving it is harmless */
        }
      }

      replaced++
      console.log(`  ${replaced}/${behind.length}  ${row.name} — ${freshIds.length} photos`)
    } catch (err) {
      problems.push(`${row.name}: ${(err as Error).message}`)
      console.log(`  !  ${row.name} — ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. ${replaced} products refreshed, ${removed} stale images deleted.`)
  if (problems.length) {
    console.log(`\n${problems.length} could not be done:`)
    problems.forEach((p) => console.log('  ' + p))
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('Refresh failed:', err)
  process.exit(1)
})
