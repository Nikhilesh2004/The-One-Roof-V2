/** ₹1,23,456 — Indian digit grouping, no decimals on whole rupees. */
export const rupees = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN')

export const skuOf = (slug: string): string => 'TOR-' + slug.toUpperCase().replace(/-/g, '')

export const waLink = (number: string, message: string): string =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`

export const percentOff = (mrp: number, price: number): number =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

export type StockState = 'out' | 'low' | 'ok'

export const stockState = (stock: number): StockState =>
  stock <= 0 ? 'out' : stock <= 5 ? 'low' : 'ok'

export const stockLabel = (stock: number): string =>
  stock <= 0 ? 'Sold out' : stock <= 5 ? `Only ${stock} left` : 'In stock'
