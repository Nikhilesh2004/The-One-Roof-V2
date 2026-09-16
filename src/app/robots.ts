import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://theoneroof.co'

/**
 * Only the real shop invites crawlers.
 *
 * A Vercel preview is the same site with the same content, and left open it
 * would compete with theoneroof.co in search results — the classic way a
 * staging site outranks the shop it was built for. Anything that is not the
 * live domain refuses every crawler outright.
 */
const isLiveSite = /(^|\.)theoneroof\.co$/.test(new URL(base).hostname)

export default function robots(): MetadataRoute.Robots {
  if (!isLiveSite) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/search'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
