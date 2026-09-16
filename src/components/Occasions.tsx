import Link from 'next/link'
import React from 'react'

/**
 * Shop by occasion.
 *
 * Someone arriving with "I need something for a wedding" does not want a
 * catalogue, they want the shortlist. Each panel is a real filtered view of
 * /shop — the same `occasion` filter the catalogue already uses — so the
 * link is honest and shareable rather than decorative.
 */
const PANELS = [
  {
    eyebrow: 'For them',
    title: 'Birthdays & celebrations',
    body: 'Perfumes, speakers, photo frames and gift articles that make the day.',
    value: 'birthday',
  },
  {
    eyebrow: 'For the home',
    title: 'Weddings & housewarmings',
    body: 'Dinner sets, Pingani ware, glassware and one gram jewellery sets.',
    value: 'wedding',
  },
  {
    eyebrow: 'For the season',
    title: 'Festivals & traditions',
    body: 'Brass idols, diyas, kalash and pooja thali for Diwali and wedding season.',
    value: 'festival',
  },
]

export function Occasions() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-16">
      <div className="mb-8 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)]">Shop by occasion</h2>
        <span className="ml-auto text-[12px] text-[var(--muted)]">Find the perfect gift</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PANELS.map((p) => (
          <Link
            key={p.value}
            href={`/shop?occasion=${p.value}`}
            className="group rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6 transition-colors hover:border-[var(--brass)]"
          >
            <p className="text-[10.5px] tracking-[0.16em] text-[var(--muted)] uppercase">
              {p.eyebrow}
            </p>
            <h3 className="mt-2 font-display text-lg transition-colors group-hover:text-[var(--brass)]">
              {p.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-2)]">{p.body}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
