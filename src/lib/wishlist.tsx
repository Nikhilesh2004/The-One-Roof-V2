'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Saved items. Like the bag, this lives in the browser — there are no
 * customer accounts to hang it off, and asking someone to register before
 * they can save a brass idol is the fastest way to lose them.
 *
 * v1 had this heart too, but it only raised a toast and stored nothing.
 */

export type SavedItem = {
  slug: string
  title: string
  price: number
  mrp: number
  stock: number
  image?: string
  category?: string
  savedAt: number
}

type WishlistContext = {
  items: SavedItem[]
  count: number
  has: (slug: string) => boolean
  toggle: (item: Omit<SavedItem, 'savedAt'>) => void
  remove: (slug: string) => void
  ready: boolean
}

const KEY = 'tor.wishlist.v2'
const Ctx = createContext<WishlistContext | null>(null)

const read = (): SavedItem[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.slug === 'string') : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* private window, or site data blocked */
    }
  }, [items, ready])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback((item: Omit<SavedItem, 'savedAt'>) => {
    setItems((prev) =>
      prev.some((i) => i.slug === item.slug)
        ? prev.filter((i) => i.slug !== item.slug)
        : [{ ...item, savedAt: Date.now() }, ...prev],
    )
  }, [])

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug))
  }, [])

  const value = useMemo<WishlistContext>(
    () => ({
      items,
      count: items.length,
      has: (slug) => items.some((i) => i.slug === slug),
      toggle,
      remove,
      ready,
    }),
    [items, toggle, remove, ready],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWishlist(): WishlistContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}
