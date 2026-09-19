import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Policies } from './collections/Policies'
import { Categories } from './collections/Categories'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · The One Roof',
    },
    components: {
      // The shop's own mark, in place of Payload's.
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Icon#Icon',
      },
      // What the shop needs on opening the CMS, above Payload's collection list.
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      // The shop's three-step path through the CMS, above the collection list.
      afterNavLinks: ['/components/admin/ShopNav#ShopNav'],
      views: {
        bulkUpload: {
          Component: '/components/admin/BulkUploadView#BulkUploadView',
          path: '/bulk-upload',
          meta: {
            title: 'Bulk upload',
            description: 'Add or update many products at once from the Excel template.',
          },
        },
        unusedPhotos: {
          Component: '/components/admin/BulkUploadView#UnusedPhotosView',
          path: '/unused-photos',
          meta: {
            title: 'Unused photos',
            description: 'Delete photos that no product uses any more.',
          },
        },
      },
    },
  },
  collections: [Products, Categories, Media, Policies, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      // Postgres runs on the same machine, well under its default limit of
      // 100 connections. Never 1: Payload holds a connection open for a
      // transaction while querying inside it, and a pool of one deadlocks.
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    },
    // Payload keeps to its own schema so the v1 site's tables, in `public`,
    // are never touched by a migration here.
    schemaName: 'payload',
    /*
     * Schema push is OFF unless explicitly asked for, and only `npm run dev`
     * asks.
     *
     * The obvious version of this is `NODE_ENV !== 'production'`, and it is
     * a trap: every `tsx` script — a seed, a photo refresh, a one-off check —
     * runs with NODE_ENV unset, so push turns on, Payload writes its "you
     * have dev-pushed" marker row, and the *next* `payload migrate` stops to
     * ask a yes/no question. On a laptop you answer it. In the container, where
     * migrations run at start with no terminal attached, it hangs for good.
     *
     * Opting in explicitly means a script can never arm that trap.
     */
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
})
