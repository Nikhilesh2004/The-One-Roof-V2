'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef } from 'react'

import { bagMessage, useBag } from '../lib/bag'
import { rupees, waLink } from '../lib/format'
import { BagIcon, CheckIcon, CloseIcon, WhatsAppIcon } from './Icons'

type Props = {
  whatsappNumber: string
  deliveryFee: number
  freeDeliveryOver: number
  deliveryNote: string
}

/**
 * The bag, and the only way an order leaves this site: a WhatsApp message
 * with every line item in it. No payment step exists, so nothing here
 * pretends one is coming.
 */
export function BagDrawer({ whatsappNumber, deliveryFee, freeDeliveryOver, deliveryNote }: Props) {
  const { lines, count, subtotal, mrpTotal, saved, setQty, remove, isOpen, setOpen } = useBag()
  const panel = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  const delivery = subtotal >= freeDeliveryOver || subtotal === 0 ? 0 : deliveryFee
  const total = subtotal + delivery

  useEffect(() => {
    if (!isOpen) return
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // The page behind must not scroll while the drawer is over it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [isOpen, setOpen])

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-50 flex h-dvh w-full max-w-[440px] flex-col border-l border-[var(--line)] bg-[var(--surface)] transition-transform duration-300 ease-[var(--ease-silk)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Head ─────────────────────────────────────────────────── */}
        <header className="flex flex-none items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-[13px] font-semibold tracking-[0.16em] uppercase">Your bag</h2>
          <span className="text-xs text-[var(--muted)]">
            {count} item{count === 1 ? '' : 's'}
          </span>
          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            aria-label="Close bag"
          >
            <CloseIcon />
          </button>
        </header>

        {/* ── Items. flex-1 with min-h-0 so a long bag scrolls here
               instead of pushing the total off the bottom. ─────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <span className="text-[var(--muted)]">
                <BagIcon size={44} />
              </span>
              <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                Your bag is empty.
                <br />
                Start with what’s trending on the channel.
              </p>
              <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-ghost">
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <ul>
              {lines.map((line) => (
                <li
                  key={line.slug}
                  className="flex gap-4 border-b border-[var(--line)] px-5 py-4 last:border-b-0"
                >
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative h-[86px] w-[70px] flex-none overflow-hidden rounded-[var(--radius-card)] bg-[var(--panel)]"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        sizes="70px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={() => setOpen(false)}
                      className="block text-sm leading-snug font-semibold hover:text-[var(--brass)]"
                    >
                      {line.title}
                    </Link>
                    {line.category && (
                      <p className="mt-0.5 text-[10.5px] tracking-[0.13em] text-[var(--muted)] uppercase">
                        {line.category}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center rounded-[var(--radius-card)] border border-[var(--line-2)]">
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty - 1)}
                          className="grid h-8 w-8 place-items-center text-[var(--ink-2)] hover:text-[var(--ink)]"
                          aria-label={`Decrease quantity of ${line.title}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(line.slug, line.qty + 1)}
                          disabled={line.qty >= line.stock}
                          className="grid h-8 w-8 place-items-center text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30"
                          aria-label={`Increase quantity of ${line.title}`}
                        >
                          +
                        </button>
                      </span>

                      <button
                        type="button"
                        onClick={() => remove(line.slug)}
                        className="text-xs text-[var(--muted)] underline underline-offset-4 hover:text-[var(--hot)]"
                      >
                        Remove
                      </button>

                      <span className="ml-auto text-sm font-semibold">
                        {rupees(line.price * line.qty)}
                      </span>
                    </div>

                    {line.qty >= line.stock && (
                      <p className="mt-2 text-[11px] text-[var(--warn)]">
                        That is all {line.stock} we have in stock.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Total and the enquiry ────────────────────────────────── */}
        {lines.length > 0 && (
          <footer className="flex-none border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-5">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[var(--ink-2)]">Subtotal at MRP</dt>
                <dd>{rupees(mrpTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-2)]">Discount</dt>
                <dd className="text-[var(--ok)]">− {rupees(saved)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-2)]">Delivery</dt>
                <dd className={delivery === 0 ? 'text-[var(--ok)]' : ''}>
                  {delivery === 0 ? 'Free' : rupees(delivery)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-[var(--brass)]">{rupees(total)}</dd>
              </div>
            </dl>

            <p className="mt-3 flex gap-2 text-[11.5px] leading-relaxed text-[var(--muted)]">
              <span className="mt-0.5 flex-none text-[var(--ok)]">
                <CheckIcon size={13} />
              </span>
              One consolidated figure, inclusive of all taxes and delivery.
            </p>

            <a
              href={waLink(whatsappNumber, bagMessage(lines, total))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa mt-4 w-full"
            >
              <WhatsAppIcon />
              Order this bag on WhatsApp
            </a>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--muted)]">
              {deliveryNote}
            </p>
          </footer>
        )}
      </aside>
    </>
  )
}
