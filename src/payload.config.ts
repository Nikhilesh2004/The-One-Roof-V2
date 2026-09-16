import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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
import { connectionString } from './lib/db-url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Photos go to Supabase Storage, which speaks S3. Without those keys the
 * project still runs — Payload falls back to writing into the local
 * filesystem, which is right for development and wrong for Vercel, where
 * the disk is thrown away on every deploy.
 */
const hasObjectStore = Boolean(
  process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
)

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
    },
  },
  collections: [Products, Categories, Media, Policies, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: {
      connectionString: connectionString(),
      // Supabase's session pooler allows 15 clients in total. `next build`
      // renders with a worker per core and each worker opens its own pool,
      // so an uncapped pool exhausts the limit and the build dies with
      // EMAXCONNSESSION. Four per process across two workers is eight
      // clients. A pool of one deadlocks instead: Payload holds a
      // connection open for a transaction while querying inside it.
      max: Number(process.env.DATABASE_POOL_MAX ?? 4),
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
     * ask a yes/no question. On a laptop you answer it. On Vercel there is no
     * terminal, and the deploy hangs until it times out.
     *
     * Opting in explicitly means a script can never arm that trap.
     */
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: hasObjectStore
    ? [
        s3Storage({
          collections: { media: true },
          /*
           * Send the file from the browser straight to Supabase.
           *
           * Without this every upload is posted to a Vercel function first,
           * and Vercel refuses a request body over 4.5MB — so a normal phone
           * photo (5-10MB) died with 413 FUNCTION_PAYLOAD_TOO_LARGE. In the
           * admin that surfaces as "nothing happens": no photo attaches, and
           * the product then cannot go live because it has no photo.
           *
           * With client uploads the admin asks the server only for a signed
           * URL and PUTs the bytes directly to storage, so the function body
           * limit never applies and the original full-size photo survives.
           */
          clientUploads: true,
          bucket: process.env.S3_BUCKET as string,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'ap-south-1',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
})
