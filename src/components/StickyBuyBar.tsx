'use client'

import React, { useEffect, useState } from 'react'

import type { BagLine } from '../lib/bag'
import { useBag } from '../lib/bag'
import { rupees } from '../lib/format'
import { WhatsAppIcon } from './Icons'

/**
 * On a phone the description, the label details and the related products
 * push the buy button a long way up the page. This keeps the price and the
 * button within reach, and only appears once the real one has scrolled
 * out of sight — so the two are never on screen together.
 */
export function StickyBuyBar({
  item,
  whatsappHref,
  watch = '#buy-actions',
}: {
  item: Omit<BagLine, 'qty'>
  whatsappHref: string
  /** The real buy buttons. The bar appears once they scroll out of sight. */
  watch?: string
}) {
  const { add } = useBag()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Watch the actual buttons rather than a marker rendered beside this
    // bar — this component sits at the end of the page, so a sentinel here
    // would only trip at the very bottom, long after the buttons had gone.
    const target = document.querySelector(watch)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [watch])

  const soldOut = item.stock <= 0

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-lg transition-transform duration-300 ease-[var(--ease-silk)] lg:hidden ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        // Hidden from assistive tech while off screen, so the buy button is
        // not announced twice.
        aria-hidden={!visible}
      >
        <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-[var(--ink-2)]">{item.title}</p>
            <p className="font-display text-lg text-[var(--brass)]">{rupees(item.price)}</p>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-11 w-11 flex-none place-items-center rounded-[var(--radius-card)] bg-[var(--wa)] text-white"
            aria-label="Enquire about this product on WhatsApp"
            tabIndex={visible ? undefined : -1}
          >
            <WhatsAppIcon size={19} />
          </a>

          <button
            type="button"
            onClick={() => add(item, 1, { open: true })}
            disabled={soldOut}
            tabIndex={visible ? undefined : -1}
            className="btn flex-none !px-6 !py-3.5 !text-[11px]"
          >
            {soldOut ? 'Sold out' : 'Add to bag'}
          </button>
        </div>
      </div>
    </>
  )
}
