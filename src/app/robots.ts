import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://theoneroof.co'

/**
 * Only the real shop invites crawlers.
 *
 * The same site answers at other addresses too — Coolify's temporary URL
 * while it is being set up, the server's bare IP — and any of them left open
 * would compete with theoneroof.co in search results, the classic way a
 * staging copy outranks the shop it was built for.
 *
 * So this decides by the address the crawler actually asked for, not by a
 * setting: a setting defaults to the live domain and would wave crawlers into
 * every copy. Coolify's proxy passes the original host through, and
 * x-forwarded-host is read first in case a proxy in front rewrites it.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(':')[0].toLowerCase()

  if (!/(^|\.)theoneroof\.co$/.test(host)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/search'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
