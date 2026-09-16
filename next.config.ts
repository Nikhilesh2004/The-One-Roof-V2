import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  experimental: {
    // Each prerender worker opens its own database pool, and Supabase's
    // session pooler allows 15 clients in total. Two workers against a pool
    // of four is eight clients, comfortably under the cap.
    cpus: 2,
  },
  /*
   * Every product photo is fetched from Supabase, and Supabase bills egress
   * on the free plan. Left at the defaults this project re-fetched each
   * image from Supabase roughly once a minute: Payload's file route answers
   * "max-age=0, must-revalidate", so the image optimiser fell back to its
   * 60-second minimum and asked again, forever.
   *
   * Media filenames are a timestamp plus random suffix and are never reused
   * — replacing a photo writes a new file and a new URL — so they are safe
   * to treat as immutable.
   */
  async headers() {
    return [
      {
        source: '/api/media/file/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  images: {
    /*
     * Vercel's image optimiser is off: the Hobby plan allows 5,000
     * transformations a month and this project passed that, so /_next/image
     * answered 402 and every photo rendered blank. Payload already stores a
     * card size at 800x1000 (~122KB) and the media route carries a one-year
     * immutable cache header, so serving the stored file directly is close to
     * what the optimiser was returning anyway.
     *
     * Remove this once the site runs on the VPS, where sharp does the same
     * work with no quota.
     */
    unoptimized: true,
    // Hold each optimised variant for a year rather than the 60-second
    // default, so Vercel serves it and Supabase is asked once.
    minimumCacheTTL: 31536000,
    // Every width here is a separate optimisation, and a separate fetch of
    // the source from Supabase. The largest stored size is 1600px wide, so
    // the 2048 and 3840 defaults only ever bought an upscale.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    localPatterns: [
      // Product photos served by Payload.
      { pathname: '/api/media/file/**' },
      // Fixed assets in /public — the shop's logo board. Without this the
      // optimiser refuses the URL and the image silently renders 0x0.
      { pathname: '/logo**' },
      { pathname: '/made-in-india**' },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
