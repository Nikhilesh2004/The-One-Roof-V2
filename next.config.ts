import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  /*
   * Photos never change once uploaded — a filename is a timestamp plus a
   * random suffix and is never reused, so replacing a photo writes a new
   * file at a new URL. That makes them safe to cache for a year, which
   * Payload's file route does not do on its own (it answers "max-age=0").
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
     * Resizing is off for now: every photo is served as stored. Payload keeps
     * a card size at 800x1000 (~122KB), so the grid is still light.
     *
     * It was switched off on 2026-09-17 when Vercel's monthly limit of 5,000
     * resizes ran out and every photo went blank. The VPS has no such limit —
     * sharp does the work on the server — so remove this line once the site
     * is confirmed working there (docs/vps/runbook.md, step 9). It stays on
     * for the first deploy so that deploy changes as little as possible.
     */
    unoptimized: true,
    // Once resizing is back on: keep each resized copy for a year rather than
    // the 60-second default, since the source photo never changes.
    minimumCacheTTL: 31536000,
    // Every width here is a separate resize. The largest stored size is
    // 1600px wide, so the 2048 and 3840 defaults only ever bought an upscale.
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
