import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { AddToBag, BuyNow } from '../../../../components/AddToBag'
import { Gallery, type Shot } from '../../../../components/Gallery'
import { ProductCard } from '../../../../components/ProductCard'
import { StickyBuyBar } from '../../../../components/StickyBuyBar'
import { WishlistButton } from '../../../../components/WishlistButton'
import { WhatsAppIcon } from '../../../../components/Icons'
import { percentOff, rupees, skuOf, stockLabel, stockState, waLink } from '../../../../lib/format'
import { imageAlt, imageUrl, mainPhoto, photosOf } from '../../../../lib/media'
import { getProductBySlug, getProducts, getSettings } from '../../../../lib/payload'
import type { Category } from '../../../../payload-types'
import { JsonLd } from '../../../../components/JsonLd'
import { breadcrumbs, graph, productSchema } from '../../../../lib/seo'

export const revalidate = 60

/**
 * Every product gets a page at its own address. In v1 tapping a product
 * swapped a hidden <section> in place without touching the URL or the
 * scroll position, so on a phone nothing appeared to happen and there was
 * nothing to share or go back to. This is a page: it has a URL, a title,
 * a back button, and a link you can paste into WhatsApp.
 */
export async function generateStaticParams() {
  const products = await getProducts({ limit: 500 })
  return products.filter((p) => p.slug).map((p) => ({ slug: p.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }

  const image = imageUrl(mainPhoto(product), 'full')
  const price = product.price ?? 0

  return {
    title: product.title,
    description:
      product.description?.slice(0, 155) ??
      `${product.title} — ${rupees(price)} at The One Roof, Guntur.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()])

  if (!product) notFound()

  const category = typeof product.category === 'object' ? (product.category as Category) : null
  const price = product.price ?? 0
  const mrp = product.mrp ?? price
  const off = percentOff(mrp, price)
  const stock = product.stock ?? 0
  const state = stockState(stock)
  const sku = skuOf(product.slug ?? '')

  const shots: Shot[] = photosOf(product)
    .map((photo) => ({
      url: imageUrl(photo, 'full') ?? '',
      thumbUrl: imageUrl(photo, 'thumb') ?? undefined,
      alt: imageAlt(photo, product.title),
    }))
    .filter((s) => s.url)

  const related = category
    ? (await getProducts({ categoryId: category.id, limit: 5 })).filter((p) => p.id !== product.id)
    : []

  const bagItem = {
    slug: product.slug ?? '',
    title: product.title,
    price,
    mrp,
    stock,
    image: imageUrl(mainPhoto(product), 'thumb') ?? undefined,
    category: category?.shortName ?? category?.name ?? undefined,
  }

  const enquiry = waLink(
    settings.whatsappNumber,
    `Hi The One Roof! I would like to enquire about: ${product.title} (${sku}), ${rupees(price)}. Is it available?`,
  )

  const specs = [
    ['Generic name', product.genericName],
    ['Net quantity', product.netQuantity],
    ['Country of origin', product.countryOfOrigin],
    ['Manufacturer / importer', product.manufacturer],
    ['Month and year', product.monthYearOfImport],
    ['Size', product.dimensions],
    ['Weight', product.weight],
    ['Material / finish', product.finish],
  ].filter(([, value]) => Boolean(value)) as [string, string][]

  return (
    <>
      {/* One graph: the product, and where it sits in the shop. */}
      <JsonLd
        data={graph(
          productSchema(product, category),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            ...(category ? [{ name: category.name, path: `/shop/${category.slug}` }] : []),
            { name: product.title, path: `/product/${product.slug}` },
          ]),
        )}
      />

      <div className="mx-auto max-w-[1240px] px-5 py-8">
        <nav aria-label="Breadcrumb" className="text-[11.5px] text-[var(--muted)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-[var(--ink)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/shop" className="hover:text-[var(--ink)]">
                Shop
              </Link>
            </li>
            {category && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/shop/${category.slug}`} className="hover:text-[var(--ink)]">
                    {category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--ink-2)]">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Gallery shots={shots} />

          <div>
            {category && (
              <p className="text-[10.5px] tracking-[0.14em] text-[var(--muted)] uppercase">
                {category.name}
                {product.subCategory ? ` · ${product.subCategory}` : ''}
              </p>
            )}

            <h1 className="mt-3 font-display text-[clamp(1.7rem,4.5vw,2.6rem)] leading-tight">
              {product.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl text-[var(--brass)]">{rupees(price)}</span>
              {mrp > price && (
                <>
                  <span className="text-sm text-[var(--muted)] line-through">{rupees(mrp)}</span>
                  <span className="bg-[var(--brass)] px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[var(--on-brass)] uppercase">
                    {off}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[11.5px] text-[var(--muted)]">Inclusive of all taxes</p>

            <p
              className={`mt-5 inline-flex rounded-sm px-3 py-1.5 text-[11.5px] tracking-[0.08em] uppercase ${
                state === 'out'
                  ? 'bg-[var(--surface-2)] text-[var(--muted)]'
                  : state === 'low'
                    ? 'bg-[var(--warn)]/15 text-[var(--warn)]'
                    : 'bg-[var(--ok)]/12 text-[var(--ok)]'
              }`}
            >
              {stockLabel(stock)}
            </p>

            <div id="buy-actions" className="mt-7 flex flex-wrap items-center gap-3">
              <AddToBag item={bagItem} />
              <BuyNow item={bagItem} />
              <a href={enquiry} target="_blank" rel="noopener noreferrer" className="btn btn-wa">
                <WhatsAppIcon />
                Enquire on WhatsApp
              </a>
              <WishlistButton item={bagItem} />
            </div>

            <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--muted)]">
              {settings.deliveryNote}
            </p>

            {product.description && (
              <p className="mt-8 border-t border-[var(--line)] pt-8 text-[14px] leading-relaxed text-[var(--ink-2)]">
                {product.description}
              </p>
            )}

            {specs.length > 0 && (
              <section className="mt-8 border-t border-[var(--line)] pt-8">
                <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-[var(--ink-2)] uppercase">
                  Label details
                </h2>
                <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {specs.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] text-[var(--muted)]">{label}</dt>
                      <dd className="mt-0.5 text-[13px]">{value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Item code</dt>
                    <dd className="mt-0.5 font-mono text-[12px]">{sku}</dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl">More from {category?.name}</h2>
            <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <StickyBuyBar item={bagItem} whatsappHref={enquiry} />
    </>
  )
}
