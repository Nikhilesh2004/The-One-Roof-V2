import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { ProductCard } from '../../../components/ProductCard'
import { SearchIcon } from '../../../components/Icons'
import { searchProducts } from '../../../lib/payload'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const results = q ? await searchProducts(q) : []

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)]">Search</h1>

      <form
        method="get"
        action="/search"
        role="search"
        className="mt-6 flex max-w-xl items-center gap-3 border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3"
      >
        <span className="text-[var(--muted)]">
          <SearchIcon size={20} />
        </span>
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="A brass idol, a tote, a wall clock…"
          aria-label="Search products"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
        />
        <button type="submit" className="btn !px-4 !py-2 !text-[11px]">
          Go
        </button>
      </form>

      {q && (
        <p className="mt-6 text-sm text-[var(--ink-2)]" aria-live="polite">
          {results.length} result{results.length === 1 ? '' : 's'} for{' '}
          <span className="text-[var(--ink)]">“{q}”</span>
        </p>
      )}

      {q && results.length === 0 && (
        <div className="py-16">
          <p className="text-sm text-[var(--ink-2)]">
            Nothing matched that. Try a shorter word, or{' '}
            <Link href="/shop" className="text-[var(--brass)] underline underline-offset-4">
              browse the whole catalogue
            </Link>
            .
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {results.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  )
}
