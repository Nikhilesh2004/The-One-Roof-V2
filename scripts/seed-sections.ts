/**
 * The shop's sections.
 *
 *   npm run seed:sections
 *
 * Restores every section v1 had, plus Pooja Items, which is printed on the
 * shop's own board but was never in v1's code at all.
 *
 * The v1 migration only created sections that already had products in
 * them, which quietly dropped five of the seven. This is the full set, so
 * the shoot has somewhere to put everything.
 *
 * Safe to re-run: matched on slug, updated rather than duplicated, and it
 * never touches a section's products.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Section = {
  slug: string
  name: string
  shortName: string
  order: number
  blurb: string
  subCategories: string[]
}

const SECTIONS: Section[] = [
  {
    slug: 'decor',
    name: 'Home & Décor',
    shortName: 'Decor',
    order: 10,
    blurb: 'Home décor, wall clocks, table lights, photo frames and unique articles.',
    subCategories: ['Home Decors', 'Wall Clocks', 'Table Lights', 'Photo Frames', 'Unique Articles'],
  },
  {
    slug: 'pooja',
    name: 'Pooja Items',
    shortName: 'Pooja',
    order: 20,
    blurb: 'Brass idols, diyas, kalash, agarbatti stands and everything for the pooja room.',
    subCategories: ['Brass Idols', 'Diyas', 'Kalash', 'Pooja Thali', 'Agarbatti Stands'],
  },
  {
    slug: 'fashion',
    name: 'Jewellery & Fashion',
    shortName: 'Jewellery',
    order: 30,
    blurb: 'One gram gold jewellery, belts and wallets, and brass items.',
    subCategories: ['One Gram Jewellery', 'Bridal Sets', 'Belts & Wallets', 'Brass Items'],
  },
  {
    slug: 'bags',
    name: 'Bags',
    shortName: 'Bags',
    order: 40,
    blurb: 'Handbags, clutches, backpacks and travel bags.',
    subCategories: ['Handbags', 'Clutches', 'Backpacks', 'Travel Bags'],
  },
  {
    slug: 'shoes',
    name: 'Shoes',
    shortName: 'Shoes',
    order: 50,
    blurb: 'Formals, casuals and everyday footwear for men, women and children.',
    subCategories: ["Men's Footwear", "Women's Footwear", "Kids' Footwear", 'Sports & Casual'],
  },
  {
    slug: 'watches',
    name: 'Watches',
    shortName: 'Watches',
    order: 60,
    blurb: 'Everyday and occasion watches, plus couple sets for gifting.',
    subCategories: ["Men's Watches", "Women's Watches", 'Couple Sets', 'Smart Watches'],
  },
  {
    slug: 'gifting',
    name: 'Gifting & Dining',
    shortName: 'Gifting',
    order: 70,
    blurb: 'Gift articles, glass articles, Pingani articles and dinner sets.',
    subCategories: ['Gift Articles', 'Glass Articles', 'Pingani Articles', 'Dinner Sets'],
  },
  {
    slug: 'lifestyle',
    name: 'Tech & Lifestyle',
    shortName: 'Lifestyle',
    order: 80,
    blurb:
      'Smart gadgets, electronics, Bluetooth speakers, copper bottles, perfumes and toys.',
    subCategories: [
      'Smart Gadgets',
      'Electronics',
      'Bluetooth Speakers',
      'Copper Bottles',
      'Perfumes',
      'Toys',
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const s of SECTIONS) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: s.slug } },
      limit: 1,
      depth: 0,
    })

    const data = {
      name: s.name,
      shortName: s.shortName,
      slug: s.slug,
      order: s.order,
      blurb: s.blurb,
      subCategories: s.subCategories.map((name) => ({ name })),
    }

    if (existing.docs[0]) {
      await payload.update({ collection: 'categories', id: existing.docs[0].id, data })
      console.log(`updated  ${s.name}`)
    } else {
      await payload.create({ collection: 'categories', data })
      console.log(`created  ${s.name}`)
    }
  }

  const all = await payload.find({ collection: 'categories', limit: 100, sort: 'order', depth: 0 })
  console.log(`\n${all.totalDocs} sections:`)
  for (const c of all.docs) {
    const n = await payload.count({
      collection: 'products',
      where: { and: [{ category: { equals: c.id } }, { status: { equals: 'live' } }] },
    })
    console.log(`  ${String(n.totalDocs).padStart(3)} live  ${c.name}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding sections failed:', err)
  process.exit(1)
})
