import type { DefaultServerCellComponentProps } from 'payload'
import React from 'react'

/**
 * The photos column in the Products list.
 *
 * A shop scans its catalogue by picture, not by filename, and Payload's
 * default renders an upload relationship as text. This draws the first few
 * photos instead.
 *
 * A server component because the list hands every cell bare photo IDs, not
 * the photos: it looks the first few up itself — one small query per row,
 * for the rows on screen — and still accepts populated photos if a deeper
 * list query ever sends them. A product with no photos says so, which is
 * worth seeing in a list, since it cannot go live without one.
 */

type Sized = { url?: string | null }
type Photo = {
  id?: number | string
  url?: string | null
  sizes?: { thumb?: Sized; card?: Sized } | null
}

const SHOWN = 3

// Smallest first — these are 44px boxes, not a gallery.
const srcOf = (p: Photo): string | null => p.sizes?.thumb?.url || p.sizes?.card?.url || p.url || null

export async function PhotosCell({ cellData, payload }: DefaultServerCellComponentProps) {
  const list: unknown[] = Array.isArray(cellData) ? cellData : []
  const ids = list.slice(0, SHOWN).map((v) => (v && typeof v === 'object' ? (v as Photo).id : v))

  let photos: Photo[] = list.filter((v): v is Photo => Boolean(v && typeof v === 'object' && 'url' in v))
  if (!photos.length && ids.length) {
    const { docs } = await payload.find({
      collection: 'media',
      where: { id: { in: ids as (number | string)[] } },
      depth: 0,
      limit: SHOWN,
      pagination: false,
      // The URLs are worked out from the filenames, so those must be selected too.
      select: { filename: true, url: true, sizes: true },
    })
    // Back in the product's own order, not the database's.
    photos = ids.map((id) => docs.find((d) => d.id === id)).filter((d): d is (typeof docs)[number] => Boolean(d))
  }

  const srcs = photos.map(srcOf).filter((s): s is string => Boolean(s))

  if (!srcs.length) {
    return (
      <div className="tor-thumbs">
        <div className="tor-thumb tor-thumb--empty" title="No photo yet — this cannot go live">
          —
        </div>
      </div>
    )
  }

  const rest = list.length - srcs.length

  return (
    <div className="tor-thumbs">
      {srcs.map((src) => (
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
