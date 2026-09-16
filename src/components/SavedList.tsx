'use client'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { useBag } from '../lib/bag'
import { rupees, stockLabel } from '../lib/format'
import { useWishlist } from '../lib/wishlist'

export function SavedList() {
  const { items, remove, ready } = useWishlist()
  const { add } = useBag()

  if (!ready) {
    return <p className="py-20 text-center text-sm text-[var(--muted)]">Loading your list…</p>
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[var(--ink-2)]">
          Nothing saved yet. Tap the heart on any product to keep it here.
        </p>
        <Link href="/shop" className="btn mt-7">
          Browse the catalogue
        </Link>
      </div>
    )
  }

  return (
    <ul className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.slug}
          className="flex flex-col border border-[var(--line)] bg-[var(--surface)]"
        >
          <Link
            href={`/product/${item.slug}`}
            className="relative block aspect-4/5 overflow-hidden bg-[var(--panel)]"
          >
            {item.image && (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 300px, 45vw"
                className="object-cover"
              />
            )}
          </Link>

          <div className="flex flex-1 flex-col gap-2 p-4">
            {item.category && (
              <p className="text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                {item.category}
              </p>
            )}
            <h2 className="text-[13.5px] leading-snug font-semibold">
              <Link href={`/product/${item.slug}`} className="hover:text-[var(--brass)]">
                {item.title}
              </Link>
            </h2>

            <p className="mt-auto pt-1 font-display text-lg">{rupees(item.price)}</p>
            <p className="text-[11px] text-[var(--muted)]">{stockLabel(item.stock)}</p>

            <button
              type="button"
              onClick={() => add(item, 1, { open: true })}
              disabled={item.stock <= 0}
              className="btn mt-2 w-full !px-4 !py-3 !text-[11px]"
            >
              {item.stock <= 0 ? 'Sold out' : 'Add to bag'}
            </button>
            <button
              type="button"
              onClick={() => remove(item.slug)}
              className="text-[11.5px] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--hot)]"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
