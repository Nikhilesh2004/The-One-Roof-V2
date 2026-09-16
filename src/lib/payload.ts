import 'server-only'

import { getPayload, type Where } from 'payload'
import configPromise from '@payload-config'

import type { Category, Policy, Product, Setting } from '../payload-types'

const client = () => getPayload({ config: configPromise })

/* ── Reads ──────────────────────────────────────────────────────────── */

export async function getSettings(): Promise<Setting> {
  const payload = await client()
  return payload.findGlobal({ slug: 'settings', depth: 1 })
}

export async function getCategories(): Promise<Category[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'order',
    depth: 0,
  })
  return docs
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

/**
 * Only live products ever leave this file.
 *
 * Every storefront read goes through here, and every one of them applies
 * this. A product being photographed in the shop is a draft, and a draft
 * that leaked onto the website — with no description and a placeholder
 * price — would be worse than no product at all.
 */
const LIVE_ONLY = { status: { equals: 'live' } } as const

export async function getProducts(options?: {
  categoryId?: string | number
  featured?: boolean
  limit?: number
  sort?: string
}): Promise<Product[]> {
  const payload = await client()
  const where: Where = { ...LIVE_ONLY }
  if (options?.categoryId) where.category = { equals: options.categoryId }
  if (options?.featured) where.featured = { equals: true }

  const { docs } = await payload.find({
    collection: 'products',
    where,
    limit: options?.limit ?? 500,
    sort: options?.sort ?? 'title',
    depth: 1,
  })
  return docs
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, LIVE_ONLY] },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

/**
 * Name, description and sub-category, case-insensitively. Small catalogue,
 * so a LIKE across three columns beats standing up a search index.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim()
  if (!q) return []

  const payload = await client()
  const { docs } = await payload.find({
    collection: 'products',
    where: {
      and: [
        LIVE_ONLY,
        {
          or: [{ title: { like: q } }, { description: { like: q } }, { subCategory: { like: q } }],
        },
      ],
    },
    limit: 60,
    sort: 'title',
    depth: 1,
  })
  return docs
}

/** Products the bag holds, fetched in one round trip rather than N. */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return []
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { in: slugs } }, LIVE_ONLY] },
    limit: slugs.length,
    depth: 1,
  })
  return docs
}

export async function getPolicies(): Promise<Policy[]> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'policies',
    limit: 50,
    sort: 'order',
    depth: 0,
  })
  return docs
}

export async function getPolicyBySlug(slug: string): Promise<Policy | null> {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'policies',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}
