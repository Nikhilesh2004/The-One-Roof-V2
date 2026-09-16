'use client'

import React from 'react'

import type { SavedItem } from '../lib/wishlist'
import { useWishlist } from '../lib/wishlist'

function Heart({ filled, size = 17 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.3 4.2 12.6a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8Z" />
    </svg>
  )
}

/**
 * The heart. `floating` is the small circle that sits on a product card;
 * the default is the labelled button on the product page.
 */
export function WishlistButton({
  item,
  floating = false,
}: {
  item: Omit<SavedItem, 'savedAt'>
  floating?: boolean
}) {
  const { has, toggle, ready } = useWishlist()
  const saved = ready && has(item.slug)

  const label = saved ? `Remove ${item.title} from saved` : `Save ${item.title}`

  if (floating) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={saved}
        onClick={(e) => {
          // The whole card is a link; saving must not navigate.
          e.preventDefault()
          e.stopPropagation()
          toggle(item)
        }}
        className={`absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-colors ${
          saved
            ? 'bg-[var(--hot)]/90 text-white'
            : 'bg-black/45 text-white/85 hover:bg-black/70 hover:text-white'
        }`}
      >
        <Heart filled={saved} />
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={saved}
      onClick={() => toggle(item)}
      className={`btn btn-ghost !px-5 ${saved ? '!text-[var(--hot)]' : ''}`}
    >
      <Heart filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
