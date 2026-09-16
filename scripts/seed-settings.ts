/**
 * Fills in the shop settings and the first FAQ set, and creates the first
 * owner login if there is not one yet.
 *
 *   npm run seed
 *
 * Everything it writes is editable at /admin afterwards — this only saves
 * the first ten minutes of typing.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const FAQS = [
  [
    'How do I place an order?',
    'Add what you want to the bag, then press “Enquire on WhatsApp”. The message arrives with your whole list in it. We confirm availability and the total, and arrange delivery from there.',
  ],
  [
    'Why can I not pay on the website?',
    'We deliberately take no payments online. Payment pages are the easiest thing to fake, and we would rather nobody lost money to a copy of ours. You pay at the shop or on delivery.',
  ],
  [
    'How do I check if something is in stock?',
    'The stock line on each product is kept current. If you want certainty on something specific, message us — we answer within minutes during shop hours.',
  ],
  [
    'Do you deliver outside Guntur?',
    'Ask us on WhatsApp with your pin code and we will tell you what is possible and what it costs.',
  ],
  [
    'Can I see the product before I buy?',
    'Yes. The shop is on Sri Nagar 5th Lane and is open seven days a week. Bring the item code from the product page and we will have it out for you.',
  ],
] as const

async function main() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'settings',
    data: {
      faqs: FAQS.map(([question, answer]) => ({ question, answer })),
    },
  })
  console.log('Shop settings seeded.')

  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs === 0) {
    console.log('\nNo account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then run:')
    console.log('  npm run create-admin')
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
