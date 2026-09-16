'use client'

import React from 'react'

import type { BagLine } from '../lib/bag'
import { useBag } from '../lib/bag'

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

/** Adds it and opens the bag, for someone who has finished choosing. */
export function BuyNow({
  item,
  className = '',
}: {
  item: Omit<BagLine, 'qty'>
  className?: string
}) {
  const { add, setOpen, lines } = useBag()
  const inBag = lines.find((l) => l.slug === item.slug)?.qty ?? 0

  if (item.stock <= 0) return null

  return (
    <button
      type="button"
      onClick={() => {
        if (inBag === 0) add(item, 1, { open: true })
        else setOpen(true)
      }}
      className={`btn btn-ghost ${className}`}
    >
      {inBag > 0 ? 'Go to bag' : 'Buy now'}
    </button>
  )
}
