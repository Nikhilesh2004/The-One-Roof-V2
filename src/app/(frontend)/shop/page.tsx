import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { Catalogue } from '../../../components/Catalogue'
import { filterProducts, filtersFromParams } from '../../../lib/filters'
import { getCategories, getProducts } from '../../../lib/payload'
import { JsonLd } from '../../../components/JsonLd'
import { breadcrumbs, graph, itemList } from '../../../lib/seo'


export const metadata: Metadata = {
  title: 'Buy Gifts, Décor & Pooja Items in Guntur',
  description:
    'The full catalogue at The One Roof, Guntur — brass idols, pooja items, gift articles, home décor, handbags and shoes. Wholesale and retail on Sri Nagar 5th Lane. Filter by price and occasion, order on WhatsApp.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'The full catalogue — The One Roof, Guntur',
    description:
      'Brass idols, pooja items, gift articles, décor, handbags and shoes. Wholesale & retail in Guntur.',
    type: 'website',
  },
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filters = filtersFromParams(params)

  const [all, categories] = await Promise.all([getProducts(), getCategories()])
  // Filtered here too, so the first paint is already correct — the client
  // takes over from an identical starting point.
  const initial = filterProducts(all, filters)

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <JsonLd
        data={graph(
          itemList(initial, 'The One Roof catalogue'),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
          ]),
        )}
      />
      <nav aria-label="Breadcrumb" className="text-[11.5px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-[var(--ink-2)]">
          Catalogue
        </span>
      </nav>

      <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)]">The full catalogue</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
        Everything on the shelves in Guntur. Add what you like to the bag and send it across on
        WhatsApp — we confirm availability and delivery from there.
      </p>

      <nav aria-label="Sections" className="mt-7 flex flex-wrap gap-2">
        <span
          aria-current="page"
          className="border border-[var(--brass)] bg-[var(--brass)] px-3.5 py-2 text-[11px] tracking-[0.11em] text-[var(--on-brass)] uppercase"
        >
          All
        </span>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop/${c.slug}`}
            className="border border-[var(--line-2)] px-3.5 py-2 text-[11px] tracking-[0.11em] text-[var(--ink-2)] uppercase transition-colors hover:border-[var(--brass)] hover:text-[var(--ink)]"
          >
            {c.shortName ?? c.name}
          </Link>
        ))}
      </nav>

      <div className="mt-9">
        <Catalogue key={JSON.stringify(filters)} products={all} initialFilters={filters} />
      </div>

      {/* Rendered for crawlers and for anyone with JavaScript off. */}
      <noscript>
        <ul>
          {initial.map((p) => (
            <li key={p.id}>
              <a href={`/product/${p.slug}`}>{p.title}</a>
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  )
}
