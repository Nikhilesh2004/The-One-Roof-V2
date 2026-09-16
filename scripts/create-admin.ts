/**
 * Creates — or resets the password of — the shop's one account.
 *
 *   npm run create-admin
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env, so the password is
 * yours and never passes through anyone else's hands. Run it once at
 * setup, and again any time you want to change the password.
 *
 * Registration is switched off in the Users collection, so this script is
 * the only way an account comes into existence. If one already exists it
 * is updated, never duplicated.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const email = process.env.ADMIN_EMAIL?.trim()
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME?.trim() || 'The One Roof'

function fail(message: string): never {
  console.error(`\n${message}\n`)
  process.exit(1)
}

if (!email || !password) {
  fail(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first, then run this again.\n\n' +
      '  ADMIN_EMAIL=you@example.com\n' +
      '  ADMIN_PASSWORD=something-long-and-not-guessable',
  )
}
if (password.length < 12) {
  fail(
    'ADMIN_PASSWORD is shorter than 12 characters. This is the only door\n' +
      'into the shop, and it faces the open internet. Use a longer one.',
  )
}

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'users', limit: 1, depth: 0 })

if (existing.docs[0]) {
  const account = existing.docs[0]
  await payload.update({
    collection: 'users',
    id: account.id,
    data: { email, password, name },
  })
  console.log(`\nUpdated the shop account: ${email}`)
  console.log('Sign in at /admin with the new password.\n')
} else {
  await payload.create({ collection: 'users', data: { email, password, name } })
  console.log(`\nCreated the shop account: ${email}`)
  console.log('Sign in at /admin. There is no sign-up screen — this is the only account.\n')
}

process.exit(0)
