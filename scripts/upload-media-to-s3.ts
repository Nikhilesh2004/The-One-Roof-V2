/**
 * Moves media already on the local disk into Supabase Storage.
 *
 *   npm run media:upload            # report only
 *   npm run media:upload -- --apply # upload
 *
 * Photos imported before the S3 keys existed were written to ./media on
 * whichever machine ran the import. Vercel throws that disk away on every
 * deploy, so anything still only there would 404 the moment the site goes
 * live. This copies each file — and every generated size — into the bucket
 * under the same key Payload will ask for.
 *
 * Nothing is deleted locally: if an upload fails, the original is still on
 * disk to try again.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const apply = process.argv.includes('--apply')
const DIR = path.resolve('media')
const Bucket = process.env.S3_BUCKET!

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  console.error('S3 keys are not set in .env. Nothing to do.')
  process.exit(1)
}
if (!fs.existsSync(DIR)) {
  console.log('No local ./media directory. Nothing to upload.')
  process.exit(0)
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

const files = fs.readdirSync(DIR).filter((f) => TYPES[path.extname(f).toLowerCase()])
console.log(`${files.length} file(s) in ./media\n`)

let already = 0
const todo: string[] = []

for (const f of files) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key: f }))
    already++
  } catch {
    todo.push(f)
  }
}

console.log(`${already} already in the bucket · ${todo.length} to upload`)

if (todo.length === 0) {
  console.log('\nEverything is already in Supabase.')
  process.exit(0)
}

if (!apply) {
  console.log('\nNothing was uploaded. To do it, run:')
  console.log('  npm run media:upload -- --apply\n')
  process.exit(0)
}

console.log('\nUploading…')
let done = 0
let bytes = 0
const failed: string[] = []

for (const f of todo) {
  try {
    const body = fs.readFileSync(path.join(DIR, f))
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: f,
        Body: body,
        ContentType: TYPES[path.extname(f).toLowerCase()],
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    done++
    bytes += body.length
    process.stdout.write(`\r  ${done}/${todo.length}`)
  } catch (err) {
    failed.push(`${f}: ${(err as Error).message}`)
  }
}

console.log(`\n\nUploaded ${done} file(s), ${Math.round(bytes / 1024 / 1024)}MB.`)
if (failed.length) {
  console.log(`\n${failed.length} failed:`)
  failed.forEach((f) => console.log('  ' + f))
  process.exit(1)
}
process.exit(0)
