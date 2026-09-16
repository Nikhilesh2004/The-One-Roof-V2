import config from '@payload-config'
import Link from 'next/link'
import { getPayload, type Where } from 'payload'
import React from 'react'

/**
 * What the shop needs to know on opening the CMS.
 *
 * Payload's own dashboard lists the collections, which answers "what can I
 * edit" — a question you only ask once. These are the questions asked every
 * day: what is live, what is about to sell out, and what is stuck in draft
 * because nobody photographed it.
 *
 * A product with no photo cannot go live, so it is counted separately: it is
 * the one number that represents work waiting on somebody.
 */

const PRODUCTS = '/admin/collections/products'

async function counts() {
  const payload = await getPayload({ config })
  const n = async (where: Where) =>
    (await payload.count({ collection: 'products', where })).totalDocs

  const [live, draft, hidden, soldOut, low, noPhoto] = await Promise.all([
    n({ status: { equals: 'live' } }),
    n({ status: { equals: 'draft' } }),
    n({ status: { equals: 'hidden' } }),
    n({ and: [{ status: { equals: 'live' } }, { stock: { equals: 0 } }] }),
    n({ and: [{ status: { equals: 'live' } }, { stock: { greater_than: 0 } }, { stock: { less_than_equal: 3 } }] }),
    n({ photos: { exists: false } }),
  ])

  return { live, draft, hidden, soldOut, low, noPhoto }
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: number
  note?: string
  tone?: 'brass' | 'warn' | 'quiet'
}) {
  return (
    <Link href={PRODUCTS} className={`tor-stat${tone ? ` tor-stat--${tone}` : ''}`}>
      <span className="tor-stat__value">{value}</span>
      <span className="tor-stat__label">{label}</span>
      {note ? <span className="tor-stat__note">{note}</span> : null}
    </Link>
  )
}

export async function Dashboard() {
  let c: Awaited<ReturnType<typeof counts>>
  try {
    c = await counts()
  } catch {
    // The dashboard must never be the reason the CMS will not open.
    return null
  }

  return (
    <section className="tor-dash">
      <header className="tor-dash__head">
        <h2 className="tor-dash__title">The shop today</h2>
        <p className="tor-dash__sub">
          {c.live} product{c.live === 1 ? '' : 's'} visible to customers right now.
        </p>
      </header>

      <div className="tor-stats">
        <Stat label="Live" value={c.live} tone="brass" note="on the website" />
        <Stat label="Drafts" value={c.draft} note="not shown yet" />
        <Stat
          label="Sold out"
          value={c.soldOut}
          tone={c.soldOut > 0 ? 'warn' : undefined}
          note="live, nothing left"
        />
        <Stat
          label="Running low"
          value={c.low}
          tone={c.low > 0 ? 'warn' : undefined}
          note="3 or fewer left"
        />
        <Stat
          label="Needs a photo"
          value={c.noPhoto}
          tone={c.noPhoto > 0 ? 'warn' : undefined}
          note="cannot go live"
        />
        <Stat label="Retired" value={c.hidden} tone="quiet" note="kept on file" />
      </div>
    </section>
  )
}

export default Dashboard
