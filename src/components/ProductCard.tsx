import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { Category, Product } from '../payload-types'
import { percentOff, rupees, stockLabel, stockState } from '../lib/format'
import { imageAlt, imageUrl, mainPhoto } from '../lib/media'
import { AddToBag } from './AddToBag'
import { WishlistButton } from './WishlistButton'

const stockClass: Record<string, string> = {
  out: 'bg-[var(--surface-2)] text-[var(--muted)]',
  low: 'bg-[var(--warn)]/15 text-[var(--warn)]',
  ok: 'bg-[var(--surface-2)] text-[var(--ink-2)]',
}

/**
 * The whole card is a link to a real product page. Everything a shopper
 * needs to decide is on it, so the page it opens is a confirmation rather
 * than a discovery.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const photo = mainPhoto(product)
  const src = imageUrl(photo, 'card')
  const price = product.price ?? 0
  const mrp = product.mrp ?? price
  const off = percentOff(mrp, price)
  const stock = product.stock ?? 0
  const state = stockState(stock)
  const category = typeof product.category === 'object' ? (product.category as Category) : null

  const item = {
    slug: product.slug ?? '',
    title: product.title,
    price,
    mrp,
    stock,
    image: imageUrl(photo, 'thumb') ?? undefined,
    category: category?.shortName ?? category?.name ?? undefined,
  }

  return (
    <article className="group relative flex flex-col border border-[var(--line)] bg-[var(--surface)] transition-colors hover:border-[var(--brass)]/50">
      <WishlistButton item={item} floating />

      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-4/5 overflow-hidden bg-[var(--panel)]"
      >
        {src ? (
          <Image
            src={src}
            alt={imageAlt(photo, product.title)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full place-items-center text-xs text-[var(--muted)]">
            No photo yet
          </span>
        )}

        {off > 0 && (
          <span className="absolute top-3 left-3 bg-[var(--brass)] px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[var(--on-brass)] uppercase">
            {off}% off
          </span>
        )}
        {state === 'out' && (
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-xs font-semibold tracking-[0.16em] text-white uppercase">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <p className="text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
            {category.shortName ?? category.name}
          </p>
        )}

        <h3 className="text-[13.5px] leading-snug font-semibold">
          <Link href={`/product/${product.slug}`} className="hover:text-[var(--brass)]">
            {product.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-display text-lg">{rupees(price)}</span>
          {mrp > price && (
            <span className="text-xs text-[var(--muted)] line-through">{rupees(mrp)}</span>
          )}
        </div>

        <span
          className={`inline-flex w-fit rounded-sm px-2 py-1 text-[10.5px] tracking-[0.08em] uppercase ${stockClass[state]}`}
        >
          {stockLabel(stock)}
        </span>

        <AddToBag className="mt-2 w-full !px-4 !py-3 !text-[11px]" item={item} />
      </div>
    </article>
  )
}
