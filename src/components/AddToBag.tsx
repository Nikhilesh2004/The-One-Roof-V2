'use client'

import React from 'react'

import type { BagLine } from '../lib/bag'
import { bagMessage, useBag } from '../lib/bag'
import { waLink } from '../lib/format'

type Props = {
  item: Omit<BagLine, 'qty'>
  className?: string
  label?: string
}

/**
 * "Add to bag", which becomes the quantity stepper once something is in
 * the bag — the pattern every Indian shopping app uses, and the reason it
 * works: the button asks one question at a time. How many is a question
 * you only have after you have decided you want it at all.
 *
 * The stepper reads from the bag itself rather than local state, so the
 * number here, the number in the drawer and the count in the header can
 * never disagree.
 */
export function AddToBag({ item, className = '', label }: Props) {
  const { add, setQty, lines } = useBag()

  const inBag = lines.find((l) => l.slug === item.slug)?.qty ?? 0
  const atCeiling = inBag >= item.stock

  if (item.stock <= 0) {
    return (
      <button type="button" disabled className={`btn ${className}`}>
        Sold out
      </button>
    )
  }

  if (inBag > 0) {
    return (
      <span
        className={`inline-flex items-center justify-between gap-1 rounded-[var(--radius-card)] bg-[var(--brass)] text-[var(--on-brass)] ${className}`}
        role="group"
        aria-label={`${item.title} quantity`}
      >
        <button
          type="button"
          onClick={() => setQty(item.slug, inBag - 1)}
          aria-label={inBag === 1 ? `Remove ${item.title} from bag` : `One fewer ${item.title}`}
          className="grid h-11 w-11 flex-none place-items-center text-lg leading-none"
        >
          −
        </button>
        <span className="min-w-[2.5rem] text-center text-[13px] font-semibold tabular-nums">
          {inBag}
        </span>
        <button
          type="button"
          onClick={() => setQty(item.slug, inBag + 1)}
          disabled={atCeiling}
          aria-label={atCeiling ? `Only ${item.stock} in stock` : `One more ${item.title}`}
          className="grid h-11 w-11 flex-none place-items-center text-lg leading-none disabled:opacity-40"
        >
          +
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      // Adding does not open the drawer: on a catalogue page that would
      // interrupt someone who is still browsing. "Buy now" is the button
      // that means "I am done".
      onClick={() => add(item, 1, { open: false })}
      className={`btn ${className}`}
    >
      {label ?? 'Add to bag'}
    </button>
  )
}

/**
 * Straight to WhatsApp with an order for this one product.
 *
 * It used to add the product to the bag and open it, which left the customer
 * one more tap from the shop — and that tap sent an enquiry. Now it is the
 * order itself: one of this, at this price, sent as a purchase. The bag is
 * left alone, so anything already in it is still there afterwards.
 */
export function BuyNow({
  item,
  whatsappNumber,
  className = '',
}: {
  item: Omit<BagLine, 'qty'>
  whatsappNumber: string
  className?: string
}) {
  if (item.stock <= 0) return null

  const message = bagMessage([{ title: item.title, price: item.price, qty: 1 }], item.price)

  return (
    <a
      href={waLink(whatsappNumber, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn-ghost ${className}`}
    >
      Buy now
    </a>
  )
}
