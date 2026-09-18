import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

/**
 * The shop's own path through the CMS, above Payload's collection list.
 *
 * Three steps in the order the work is done. An earlier version listed twelve
 * links and the client said it could not be understood in one go; everything
 * else is still reachable from the collection list below this.
 *
 * Bulk upload leads because that is how products arrive now — the photo team
 * fills the spreadsheet, the images come through the ChatGPT step, and both
 * land here together. Drafts carry a count because a draft is work waiting on
 * somebody.
 */
export async function ShopNav() {
  let drafts = 0
  try {
    const payload = await getPayload({ config: configPromise })
    drafts = (await payload.count({ collection: 'products', where: { status: { equals: 'draft' } } }))
      .totalDocs
  } catch {
    // The menu still renders if the database is briefly unreachable.
  }

  return (
    <div className="tor-nav">
      {/*
        On a phone the sidebar is taller than the screen, so whatever sits at
        the bottom — Payload's own Log out — could not be reached without
        zooming out. This lets the sidebar scroll on short screens, and the
        Log out link below puts it where it is found without hunting.
      */}
      <style>{`
        @media (max-height: 820px) {
          .nav__scroll, .nav .nav__wrap {
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      <Step href="/admin/bulk-upload" n="1" title="Bulk upload" hint="Add or update many products from Excel" />
      <Step
        href="/admin/collections/products?where[status][equals]=draft"
        n="2"
        title="Finish drafts"
        hint="Products not on the website yet"
        badge={drafts || undefined}
      />
      <Step href="/admin/collections/products" n="3" title="All products" hint="Edit one, or filter by section" />

      <Link href="/admin/logout" className="tor-nav__logout">
        Log out
      </Link>
    </div>
  )
}

function Step({
  href,
  n,
  title,
  hint,
  badge,
}: {
  href: string
  n: string
  title: string
  hint: string
  badge?: number
}) {
  return (
    <Link href={href} className="tor-step">
      <span className="tor-step__n">{n}</span>
      <span className="tor-step__text">
        <span className="tor-step__title">
          {title}
          {badge !== undefined && <span className="tor-step__badge">{badge}</span>}
        </span>
        <span className="tor-step__hint">{hint}</span>
      </span>
    </Link>
  )
}

export default ShopNav
