import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { getCategories, getSettings } from '../../../lib/payload'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'About the shop',
  description:
    'The One Roof began as a single shop in Guntur and grew through Telugu-language Shorts. Same buyer, same prices, same address.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()])

  return (
    <div className="mx-auto max-w-[820px] px-5 py-14">
      <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)]">The shop under the roof</h1>

      <p className="mt-6 text-[15.5px] leading-relaxed text-[var(--ink-2)]">{settings.aboutText}</p>

      <section className="mt-14 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        <Point
          k="01"
          h="Quality assured"
          p="Every product is hand-selected and checked before it reaches the shelf."
        />
        <Point
          k="02"
          h="A real collection"
          p={`${categories.length} sections, chosen by one buyer — not a generic catalogue.`}
        />
        <Point
          k="03"
          h="WhatsApp support"
          p="One message and we are with you. Replies in minutes during shop hours."
        />
      </section>

      <section className="mt-14 border-t border-[var(--line)] pt-10">
        <h2 className="font-display text-2xl">Why there is no payment button</h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
          Online payment pages are the easiest thing in the world to imitate, and a customer who
          gets phished on a fake version of our checkout loses real money. So we do not take card or
          UPI details on this website at all. You build a bag here, send it to us on WhatsApp, and
          we confirm the total with you directly. Payment happens at the shop or on delivery — the
          way it always has.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className="btn">
          Browse the catalogue
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          Visit or call
        </Link>
      </div>
    </div>
  )
}

function Point({ k, h, p }: { k: string; h: string; p: string }) {
  return (
    <div className="bg-[var(--surface)] p-6">
      <p className="text-[10.5px] font-semibold tracking-[0.14em] text-[var(--brass)] uppercase">
        {k}
      </p>
      <h3 className="mt-2 text-[14.5px] font-semibold">{h}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">{p}</p>
    </div>
  )
}
