import type { Product } from '../payload-types'

export type Filters = {
  sort: string
  price: string
  occasions: string[]
  inStock: boolean
}

export const EMPTY: Filters = { sort: 'name', price: 'all', occasions: [], inStock: false }

export const PRICE_BANDS: { value: string; label: string; min: number; max: number }[] = [
  { value: 'under-500', label: 'Under ₹500', min: 0, max: 500 },
  { value: '500-1500', label: '₹500 – ₹1,500', min: 500, max: 1500 },
  { value: '1500-3000', label: '₹1,500 – ₹3,000', min: 1500, max: 3000 },
  { value: 'over-3000', label: 'Over ₹3,000', min: 3000, max: Number.POSITIVE_INFINITY },
]

export const OCCASION_OPTIONS: { value: string; label: string }[] = [
  { value: 'birthday', label: 'Birthdays & celebrations' },
  { value: 'wedding', label: 'Weddings & housewarmings' },
  { value: 'festival', label: 'Festivals & traditions' },
  { value: 'everyday', label: 'Everyday & self' },
]

export const SORTS: { value: string; label: string }[] = [
  { value: 'name', label: 'Name, A to Z' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Newest first' },
]

const inBand = (p: Product, band: string): boolean => {
  if (band === 'all') return true
  const b = PRICE_BANDS.find((x) => x.value === band)
  if (!b) return true
  const price = p.price ?? 0
  return price >= b.min && price < b.max
}

const matchesOccasions = (p: Product, occasions: string[]): boolean =>
  occasions.length === 0 || occasions.some((o) => (p.occasions ?? []).includes(o as never))

const matchesStock = (p: Product, inStock: boolean): boolean => !inStock || (p.stock ?? 0) > 0

export function filterProducts(products: Product[], f: Filters): Product[] {
  const out = products.filter(
    (p) => inBand(p, f.price) && matchesOccasions(p, f.occasions) && matchesStock(p, f.inStock),
  )

  switch (f.sort) {
    case 'price-asc':
      out.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      break
    case 'price-desc':
      out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      break
    case 'newest':
      out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      break
    default:
      out.sort((a, b) => a.title.localeCompare(b.title))
  }
  return out
}

/**
 * How many products each option would show.
 *
 * A facet's own value is excluded from its own count, so ticking one price
 * band does not drive every other band to zero — the counts stay useful for
 * deciding where to go next, which is the whole point of showing them.
 */
export function countsFor(products: Product[], f: Filters) {
  const withoutPrice = products.filter(
    (p) => matchesOccasions(p, f.occasions) && matchesStock(p, f.inStock),
  )
  const withoutOccasion = products.filter((p) => inBand(p, f.price) && matchesStock(p, f.inStock))
  const withoutStock = products.filter(
    (p) => inBand(p, f.price) && matchesOccasions(p, f.occasions),
  )

  return {
    price: {
      all: withoutPrice.length,
      ...Object.fromEntries(
        PRICE_BANDS.map((b) => [b.value, withoutPrice.filter((p) => inBand(p, b.value)).length]),
      ),
    } as Record<string, number>,
    occasions: Object.fromEntries(
      OCCASION_OPTIONS.map((o) => [
        o.value,
        withoutOccasion.filter((p) => (p.occasions ?? []).includes(o.value as never)).length,
      ]),
    ) as Record<string, number>,
    inStock: withoutStock.filter((p) => (p.stock ?? 0) > 0).length,
  }
}

/** Filters as they appear in the address bar, so a view can be shared. */
export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams()
  if (f.sort !== EMPTY.sort) params.set('sort', f.sort)
  if (f.price !== EMPTY.price) params.set('price', f.price)
  if (f.occasions.length) params.set('occasion', f.occasions.join(','))
  if (f.inStock) params.set('stock', 'in')
  const q = params.toString()
  return q ? `?${q}` : ''
}

export function filtersFromParams(params: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined)
  return {
    sort: one('sort') ?? EMPTY.sort,
    price: one('price') ?? EMPTY.price,
    occasions: (one('occasion') ?? '').split(',').filter(Boolean),
    inStock: one('stock') === 'in',
  }
}
