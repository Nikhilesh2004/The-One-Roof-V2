'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * The bag lives in the browser and nowhere else. There is no checkout to
 * protect and no order to store — the bag's only job is to become a
 * WhatsApp message. So: localStorage, one key, no account, no server.
 */

export type BagLine = {
  slug: string
  title: string
  price: number
  mrp: number
  stock: number
  image?: string
  category?: string
  qty: number
}

type BagContext = {
  lines: BagLine[]
  count: number
  subtotal: number
  mrpTotal: number
  saved: number
  add: (item: Omit<BagLine, 'qty'>, qty?: number, options?: { open?: boolean }) => void
  setQty: (slug: string, qty: number) => void
  remove: (slug: string) => void
  clear: () => void
  isOpen: boolean
  setOpen: (open: boolean) => void
  ready: boolean
}

const KEY = 'tor.bag.v2'
const Ctx = createContext<BagContext | null>(null)

const read = (): BagLine[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.slug === 'string') : []
  } catch {
    // Private windows and blocked site data both throw here. An empty bag
    // is the right answer; a crashed page is not.
    return []
  }
}

const write = (lines: BagLine[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    /* nothing to do — the bag simply will not survive a reload */
  }
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([])
  const [isOpen, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Server and first client render must agree, so the bag is read after
  // mount rather than during it.
  useEffect(() => {
    setLines(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) write(lines)
  }, [lines, ready])

  // A bag opened in two tabs stays one bag.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLines(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((item: Omit<BagLine, 'qty'>, qty = 1, options?: { open?: boolean }) => {
    setLines((prev) => {
      const at = prev.findIndex((l) => l.slug === item.slug)
      const ceiling = Math.max(item.stock, 0)
      if (at < 0) return [...prev, { ...item, qty: Math.min(qty, ceiling) || Math.min(1, ceiling) }]
      const next = [...prev]
      // Refresh price and stock from the page that added it, in case the
      // shop changed them since this bag was last touched.
      next[at] = {
        ...next[at],
        ...item,
        qty: Math.min(next[at].qty + qty, ceiling),
      }
      return next
    })
    // The drawer only opens when the caller asks. Adding from a catalogue
    // grid should not throw a panel over the grid someone is still reading.
    if (options?.open) setOpen(true)
  }, [])

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(qty, l.stock) } : l)),
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<BagContext>(() => {
    const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0)
    const mrpTotal = lines.reduce((t, l) => t + (l.mrp || l.price) * l.qty, 0)
    return {
      lines,
      count: lines.reduce((t, l) => t + l.qty, 0),
      subtotal,
      mrpTotal,
      saved: Math.max(mrpTotal - subtotal, 0),
      add,
      setQty,
      remove,
      clear,
      isOpen,
      setOpen,
      ready,
    }
  }, [lines, add, setQty, remove, clear, isOpen, ready])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBag(): BagContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBag must be used inside <BagProvider>')
  return ctx
}

/**
 * An order, written out as the message the shop will receive.
 *
 * Used by the bag ("Order this bag on WhatsApp") and by Buy now, with one
 * line. Both are someone who has decided to buy, so it says so — the product
 * page's "Enquire on WhatsApp" is the one that asks whether something is
 * available.
 */
export function bagMessage(lines: Pick<BagLine, 'title' | 'price' | 'qty'>[], total: number): string {
  const items = lines.map(
    (l, i) =>
      `${i + 1}. ${l.title} — ${l.qty} × ₹${l.price.toLocaleString('en-IN')} = ₹${(
        l.price * l.qty
      ).toLocaleString('en-IN')}`,
  )
  return [
    'Hi The One Roof! I would like to buy:',
    '',
    ...items,
    '',
    `Total: ₹${total.toLocaleString('en-IN')}`,
    '',
    'Please confirm my order and delivery. Thank you!',
  ].join('\n')
}
