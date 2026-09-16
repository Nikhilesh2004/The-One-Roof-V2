import Link from 'next/link'
import React from 'react'

import { ProductCard } from '../../components/ProductCard'
import { ShortsRail, type ShortCard } from '../../components/ShortsRail'
import { Occasions } from '../../components/Occasions'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import { YouTubeIcon } from '../../components/Icons'
import { imageUrl, mainPhoto } from '../../lib/media'
import { getCategories, getProducts, getSettings } from '../../lib/payload'
import { JsonLd } from '../../components/JsonLd'
import { faqSchema, graph, itemList } from '../../lib/seo'

export const revalidate = 60

export default async function HomePage() {
  const [settings, categories, featured, newest] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featured: true }),
    getProducts({ limit: 8, sort: '-createdAt' }),
  ])

  const shorts: ShortCard[] = featured.map((p) => ({
    slug: p.slug ?? '',
    title: p.title,
    caption: p.shortCaption || p.title,
    sticker: p.shortSticker || undefined,
    price: p.price ?? 0,
    image: imageUrl(mainPhoto(p), 'card'),
  }))

  const subCategoryCount = categories.reduce(
    (total, c) => total + (c.subCategories?.length ?? 0),
    0,
  )

  return (
    <>
      {/* The questions, so they can win their own result in Google, and
          the featured products as a declared list. */}
      <JsonLd
        data={graph(
          settings.faqs && settings.faqs.length > 0 ? faqSchema(settings.faqs) : null,
          featured.length > 0 ? itemList(featured, 'Shoppable Shorts') : null,
        )}
      />

      {/* ═══ Hero ═══════════════════════════════════════════════════ */}
      <section className="grid-ink relative border-b border-[var(--line)]">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="rise">
            {settings.heroEyebrow && (
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--brass)] uppercase">
                {settings.heroEyebrow}
              </p>
            )}
            <h1 className="mt-5 font-display text-[clamp(2.2rem,7vw,3.9rem)] leading-[1.06]">
              {settings.heroHeadline}
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--ink-2)]">
              {settings.heroBody}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn">
                Shop the catalogue
              </Link>
              <a href="#shorts" className="btn btn-ghost">
                Watch the drops
              </a>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
              {settings.subscriberCount && (
                <div>
                  <dd className="font-display text-3xl">{settings.subscriberCount}</dd>
                  <dt className="mt-1 text-[10.5px] tracking-[0.13em] text-[var(--muted)] uppercase">
                    Subscribers
                  </dt>
                </div>
              )}
              <div>
                <dd className="font-display text-3xl">{subCategoryCount || categories.length}</dd>
                <dt className="mt-1 text-[10.5px] tracking-[0.13em] text-[var(--muted)] uppercase">
                  Categories
                </dt>
              </div>
              <div>
                <dd className="font-display text-3xl">1</dd>
                <dt className="mt-1 text-[10.5px] tracking-[0.13em] text-[var(--muted)] uppercase">
                  Roof
                </dt>
              </div>
            </dl>
          </div>

          {/* ── Shoppable Shorts ─────────────────────────────────── */}
          {shorts.length > 0 && (
            <div id="shorts" className="min-w-0 scroll-mt-28">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.13em] uppercase">
                  <span className="text-[var(--hot)]">
                    <YouTubeIcon />
                  </span>
                  Shoppable Shorts
                </h2>
                {settings.youtubeHandle && (
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {settings.youtubeHandle}
                  </span>
                )}
              </div>
              <ShortsRail items={shorts} speed={settings.shortsSpeed} />
              <p className="mt-3 text-[11.5px] text-[var(--muted)]">
                Tap any Short to open the product. Hover to hold the row still.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Sections of the shop ═══════════════════════════════════ */}
      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)]">Walk the shop</h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--ink-2)]">
          Every section, the way the shelves are laid out in Guntur.
        </p>

        <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="group flex flex-col gap-2 bg-[var(--void)] p-7 transition-colors hover:bg-[var(--surface-2)]"
            >
              <h3 className="font-display text-xl">{c.name}</h3>
              {c.subCategories && c.subCategories.length > 0 && (
                <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                  {c.subCategories.map((s) => s.name).join(' · ')}
                </p>
              )}
              {c.blurb && <p className="text-[12.5px] text-[var(--ink-2)]">{c.blurb}</p>}
              <span className="mt-3 text-[11px] tracking-[0.13em] text-[var(--brass)] uppercase">
                Browse →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Latest ═════════════════════════════════════════════════ */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 pb-16">
          <div className="mb-8 flex flex-wrap items-baseline gap-4">
            <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)]">Just in</h2>
            <Link
              href="/shop"
              className="ml-auto text-[11.5px] tracking-[0.13em] text-[var(--brass)] uppercase hover:underline"
            >
              See everything →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newest.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ Shop by occasion ═══════════════════════════════════════ */}
      <Occasions />

      {/* ═══ Why choose us ══════════════════════════════════════════ */}
      <WhyChooseUs />

      {/* ═══ Questions ══════════════════════════════════════════════ */}
      {settings.faqs && settings.faqs.length > 0 && (
        <section className="mx-auto max-w-[820px] px-5 pb-20">
          <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)]">Questions</h2>
          <div className="mt-8 border-t border-[var(--line)]">
            {settings.faqs.map((faq) => (
              <details key={faq.id} className="group border-b border-[var(--line)]">
                <summary className="flex cursor-pointer items-center gap-4 py-5 text-sm font-medium marker:content-none">
                  {faq.question}
                  <span className="ml-auto flex-none text-[var(--brass)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
