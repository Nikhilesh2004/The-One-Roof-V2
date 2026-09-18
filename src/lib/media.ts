import type { Media, Product } from '../payload-types'

type Sized = { url?: string | null; width?: number | null; height?: number | null }

const isMedia = (v: unknown): v is Media =>
  typeof v === 'object' && v !== null && 'url' in (v as Record<string, unknown>)

/**
 * A named size if it was generated, the original otherwise. Payload only
 * makes a size when the source is at least that big, so `card` can be
 * missing on a small upload and the original has to stand in.
 */
export function imageUrl(
  media: unknown,
  size: 'thumb' | 'card' | 'full' | 'original' = 'card',
): string | null {
  if (!isMedia(media)) return null
  if (size !== 'original') {
    const sized = media.sizes?.[size] as Sized | undefined
    if (sized?.url) return sized.url
  }
  return media.url ?? null
}

export function imageAlt(media: unknown, fallback: string): string {
  if (isMedia(media) && media.alt) return media.alt
  return fallback
}

export function imageSize(media: unknown): { width: number; height: number } {
  if (isMedia(media) && media.width && media.height) {
    return { width: media.width, height: media.height }
  }
  return { width: 800, height: 1000 }
}

/** The photos of a product, in the order the shop arranged them. */
export function photosOf(product: Product): Media[] {
  const raw = product.photos
  if (!Array.isArray(raw)) return []
  return raw.filter(isMedia)
}

/**
 * The one picture that stands for a product — in the grid, the Shorts rail
 * and link previews. The grid picture when the shop has set one, otherwise the
 * first photo. The product page's own gallery uses photosOf() and is
 * unaffected: the grid picture is a separate image, not one of the photos.
 */
export function mainPhoto(product: Product): Media | null {
  if (isMedia(product.thumbnail)) return product.thumbnail
  return photosOf(product)[0] ?? null
}
