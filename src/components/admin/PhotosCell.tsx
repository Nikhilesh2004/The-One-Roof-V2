'use client'

import React from 'react'

/**
 * The photos column in the Products list.
 *
 * A shop scans its catalogue by picture, not by filename, and Payload's
 * default renders an upload relationship as text. This draws the first few
 * photos instead.
 *
 * Written defensively on purpose: depending on the depth the list view
 * queries at, `cellData` arrives either as populated documents or as bare
 * IDs. Anything without a usable URL is skipped rather than rendered as a
 * broken image, and a product with no photos at all says so — which is
 * worth seeing in a list, since it cannot go live without one.
 */

type Sized = { url?: string | null }
type Photo = {
  id?: number | string
  url?: string | null
  alt?: string | null
  sizes?: { thumb?: Sized; card?: Sized } | null
}

const SHOWN = 3

function srcOf(photo: unknown): string | null {
  if (!photo || typeof photo !== 'object') return null
  const p = photo as Photo
  // Smallest first — these are 44px boxes, not a gallery.
  return p.sizes?.thumb?.url || p.sizes?.card?.url || p.url || null
}

export function PhotosCell({ cellData }: { cellData?: unknown }) {
  const list = Array.isArray(cellData) ? cellData : []
  const srcs = list.map(srcOf).filter((s): s is string => Boolean(s))

  if (!srcs.length) {
    return (
      <div className="tor-thumbs">
        <div
          className="tor-thumb tor-thumb--empty"
          title={list.length ? 'Photos are attached' : 'No photo yet — this cannot go live'}
        >
          {list.length ? '•' : '—'}
        </div>
      </div>
    )
  }

  const shown = srcs.slice(0, SHOWN)
  const rest = srcs.length - shown.length

  return (
    <div className="tor-thumbs">
      {shown.map((src) => (
        <div className="tor-thumb" key={src}>
          {/* Deliberately a plain img: next/image inside the admin would
              route through the optimiser for a 44px box on every row. */}
          <img src={src} alt="" loading="lazy" decoding="async" />
        </div>
      ))}
      {rest > 0 && <div className="tor-thumb tor-thumb--more">+{rest}</div>}
    </div>
  )
}

export default PhotosCell
