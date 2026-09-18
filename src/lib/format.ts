/** ₹1,23,456 — Indian digit grouping, no decimals on whole rupees. */
export const rupees = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN')

export const skuOf = (slug: string): string => 'TOR-' + slug.toUpperCase().replace(/-/g, '')

export const waLink = (number: string, message: string): string =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

/**
 * A product's full address, for WhatsApp messages. A wa.me link can only
 * carry text, never a file — so the picture reaches the shop as the link's
 * preview, which WhatsApp builds from the product page's og:image.
 */
export const productUrl = (slug: string): string =>
  `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theoneroof.co'}/product/${slug}`

export const percentOff = (mrp: number, price: number): number =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

export type StockState = 'out' | 'low' | 'ok'

export const stockState = (stock: number): StockState =>
  stock <= 0 ? 'out' : stock <= 5 ? 'low' : 'ok'

export const stockLabel = (stock: number): string =>
  stock <= 0 ? 'Sold out' : stock <= 5 ? `Only ${stock} left` : 'In stock'
