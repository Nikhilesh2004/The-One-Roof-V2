import type { MetadataRoute } from 'next'

import { getCategories, getProducts } from '../../lib/payload'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://theoneroof.co'

// Rendered on each visit, not at build: the VPS build has no database to
// read, and a change made in the CMS then shows on the site immediately.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts({ limit: 50000 }), getCategories()])

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    ...categories.map((c) => ({
      url: `${base}/shop/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
