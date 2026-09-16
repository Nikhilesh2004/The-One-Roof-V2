'use client'

import Link from 'next/link'
import React from 'react'

import { useWishlist } from '../lib/wishlist'

export function WishlistLink() {
  const { count, ready } = useWishlist()

  return (
    <Link
      href="/wishlist"
      className="relative grid h-10 w-10 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      aria-label={count > 0 ? `Saved items, ${count}` : 'Saved items'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20.3 4.2 12.6a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z" />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--hot)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
