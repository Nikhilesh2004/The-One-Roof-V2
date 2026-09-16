import React from 'react'

/**
 * Three reasons to buy here rather than from a marketplace.
 *
 * Deliberately claims only what the shop can stand behind — no invented
 * guarantees, no delivery promises, and nothing about payment, because the
 * shop takes none on the website.
 */
const POINTS = [
  {
    n: '01',
    title: 'Quality assured',
    body: 'Every product is hand-selected and quality-checked before it reaches the shelf.',
  },
  {
    n: '02',
    title: 'Curated selection',
    body: 'A real shop in Guntur, stocked by the people who run it — not a generic catalogue.',
  },
  {
    n: '03',
    title: 'WhatsApp support',
    body: 'One message and we are with you. Replies in minutes during store hours.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-16">
      <div className="mb-8 flex flex-wrap items-baseline gap-4">
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)]">Why choose us</h2>
        <span className="ml-auto text-[12px] text-[var(--muted)]">A store that genuinely cares</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.n} className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
            <p className="text-[11px] tracking-[0.2em] text-[var(--brass)]">{p.n}</p>
            <h3 className="mt-2 font-display text-lg">{p.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-2)]">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
