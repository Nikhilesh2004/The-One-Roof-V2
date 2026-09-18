import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Catalogue } from '../../../../components/Catalogue'
import { filterProducts, filtersFromParams } from '../../../../lib/filters'
import { getCategories, getCategoryBySlug, getProducts, getSettings } from '../../../../lib/payload'
import { WhatsAppIcon } from '../../../../components/Icons'
import { waLink } from '../../../../lib/format'
import { JsonLd } from '../../../../components/JsonLd'
import { breadcrumbs, categoryDescription, graph, itemList } from '../../../../lib/seo'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const found = await getCategoryBySlug(category)
  if (!found) return { title: 'Section not found' }

  const stock = await getProducts({ categoryId: found.id })
  const description = categoryDescription(found, stock.length)

  return {
    // "Bags in Guntur" is what gets typed; "Bags" is not.
    title: `${found.name} in Guntur`,
    description,
    alternates: { canonical: `/shop/${found.slug}` },
    openGraph: {
      title: `${found.name} — The One Roof, Guntur`,
      description,
      type: 'website',
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const filters = filtersFromParams(query)
  const [all, categories, settings] = await Promise.all([
    getProducts({ categoryId: category.id }),
    getCategories(),
    getSettings(),
  ])
  const initial = filterProducts(all, filters)

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      {/* The section declared as a list of products, plus where it sits. */}
      <JsonLd
        data={graph(
          itemList(initial, category.name),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: category.name, path: `/shop/${category.slug}` },
          ]),
        )}
      />
      <nav aria-label="Breadcrumb" className="text-[11.5px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/shop" className="hover:text-[var(--ink)]">
          Shop
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-[var(--ink-2)]">
          {category.name}
        </span>
      </nav>

      <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)]">{category.name}</h1>
      {category.blurb && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
          {category.blurb}
        </p>
      )}
      {category.subCategories && category.subCategories.length > 0 && (
        <p className="mt-3 text-[12.5px] text-[var(--muted)]">
          {category.subCategories.map((s) => s.name).join(' · ')}
        </p>
      )}

      <nav aria-label="Sections" className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className="border border-[var(--line-2)] px-3.5 py-2 text-[11px] tracking-[0.11em] text-[var(--ink-2)] uppercase transition-colors hover:border-[var(--brass)] hover:text-[var(--ink)]"
        >
          All
        </Link>
        {categories.map((c) =>
          c.id === category.id ? (
            <span
              key={c.id}
              aria-current="page"
              className="border border-[var(--brass)] bg-[var(--brass)] px-3.5 py-2 text-[11px] tracking-[0.11em] text-[var(--on-brass)] uppercase"
            >
              {c.shortName ?? c.name}
            </span>
          ) : (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="border border-[var(--line-2)] px-3.5 py-2 text-[11px] tracking-[0.11em] text-[var(--ink-2)] uppercase transition-colors hover:border-[var(--brass)] hover:text-[var(--ink)]"
            >
              {c.shortName ?? c.name}
            </Link>
          ),
        )}
      </nav>

      {all.length === 0 ? (
        /* A section the shop has but has not photographed yet. Saying so
           plainly beats an empty grid that reads as a broken page. */
        <div className="mt-12 border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="font-display text-xl">We are photographing this section now.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--ink-2)]">
            {category.subCategories && category.subCategories.length > 0
              ? `${category.subCategories.map((x) => x.name).join(', ')} — all of it is on the shelves in Guntur, just not on the website yet.`
              : 'It is on the shelves in Guntur, just not on the website yet.'}{' '}
            Ask us and we will send photos and prices today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={waLink(
                settings.whatsappNumber,
                `Hi The One Roof! Do you have ${category.name} in stock? Please send photos and prices.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              <WhatsAppIcon />
              Ask about {category.shortName ?? category.name}
            </a>
            <Link href="/shop" className="btn btn-ghost">
              Browse what is online
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-9">
          <Catalogue key={JSON.stringify(filters)} products={all} initialFilters={filters} />
        </div>
      )}

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
