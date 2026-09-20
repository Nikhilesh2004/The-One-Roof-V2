import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { Category, Policy, Setting } from '../payload-types'
import { waLink } from '../lib/format'
import { WhatsAppIcon, YouTubeIcon } from './Icons'

export function Footer({
  categories,
  settings,
  policies,
}: {
  categories: Category[]
  settings: Setting
  policies: Policy[]
}) {
  const wa = waLink(
    settings.whatsappNumber,
    'Hi The One Roof! I have a question about your products.',
  )

  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          {/* The shop's real board, as it hangs on Sri Nagar 5th Lane. */}
          <Link href="/" aria-label="The One Roof — home" className="block max-w-[280px]">
            <Image
              src="/logo.webp"
              alt="The One Roof — everything you need under the one roof. Wholesale & retail."
              width={1100}
              height={500}
              sizes="280px"
              className="h-auto w-full"
            />
          </Link>
          <p className="mt-4 text-[12.5px] leading-relaxed whitespace-pre-line text-[var(--muted)]">
            {settings.address}
          </p>
          {settings.hours && (
            <p className="mt-2 text-[12.5px] text-[var(--muted)]">{settings.hours}</p>
          )}

          {/*
            The Consumer Protection (E-Commerce) Rules, 2020 require every
            seller to publish a named grievance officer with contact details
            and a response time. It renders only once a name is set, so an
            unfinished setting never puts a half-declaration on the page.
          */}
          {settings.grievance?.name && (
            <div className="mt-6 rounded-md border border-[var(--line)] p-4">
              <p className="text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
                Grievance officer
              </p>
              <p className="mt-1.5 text-[12.5px] font-semibold">{settings.grievance.name}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">
                {settings.grievance.email && (
                  <a href={`mailto:${settings.grievance.email}`} className="hover:text-[var(--brass)]">
                    {settings.grievance.email}
                  </a>
                )}
                {settings.grievance.email && settings.grievance.phone ? ' · ' : ''}
                {settings.grievance.phone}
              </p>
              {settings.grievance.note && (
                <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--muted)]">
                  {settings.grievance.note}
                </p>
              )}
            </div>
          )}
        </div>

        <nav aria-labelledby="foot-shop">
          <h2
            id="foot-shop"
            className="mb-4 text-[10.5px] font-semibold tracking-[0.16em] text-[var(--ink-2)] uppercase"
          >
            Shop
          </h2>
          <ul className="space-y-2.5 text-[12.5px] text-[var(--muted)]">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop/${c.slug}`} className="hover:text-[var(--brass)]">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="hover:text-[var(--brass)]">
                The full catalogue
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="foot-shop-info">
          <h2
            id="foot-shop-info"
            className="mb-4 text-[10.5px] font-semibold tracking-[0.16em] text-[var(--ink-2)] uppercase"
          >
            The shop
          </h2>
          <ul className="space-y-2.5 text-[12.5px] text-[var(--muted)]">
            <li>
              <Link href="/about" className="hover:text-[var(--brass)]">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--brass)]">
                Visit or call
              </Link>
            </li>
            <li>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[var(--brass)]"
              >
                <WhatsAppIcon size={13} />
                Chat on WhatsApp
              </a>
            </li>
            {settings.youtubeHandle && (
              <li>
                <a
                  href={`https://youtube.com/${settings.youtubeHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[var(--brass)]"
                >
                  <YouTubeIcon size={15} />
                  {settings.youtubeHandle}
                </a>
              </li>
            )}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-[10.5px] font-semibold tracking-[0.16em] text-[var(--ink-2)] uppercase">
            Reach us
          </h2>
          <ul className="space-y-2.5 text-[12.5px] text-[var(--muted)]">
            {settings.displayPhone && (
              <li>
                <a
                  href={`tel:${settings.displayPhone.replace(/\s/g, '')}`}
                  className="hover:text-[var(--brass)]"
                >
                  {settings.displayPhone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-[var(--brass)]">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>

          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-wa mt-5 text-[11px]"
          >
            <WhatsAppIcon />
            Message the shop
          </a>
        </div>
      </div>

      {policies.length > 0 && (
        <nav
          aria-label="Policies and compliance"
          className="border-t border-[var(--line)] px-5 py-6"
        >
          <ul className="mx-auto flex max-w-[1240px] flex-wrap justify-center gap-x-6 gap-y-2">
            {policies.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/policies/${p.slug}`}
                  className="text-[12px] text-[var(--muted)] hover:text-[var(--brass)]"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ── The maker's credit, centred, above the shop's line ──────────
          Who built and who looks after the site, on one line under the
          builder's mark. No copyright line here: the copyright below is the
          shop's, and the team's rule is one owner, not two. */}
      {settings.agencyName && (
        <div className="border-t border-[var(--line)] px-5 py-8">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-3 text-center">
            {settings.madeInIndia && (
              // The mark is a solid black silhouette, so it needs its own
              // light ground — on the dark footer it would otherwise be an
              // invisible rectangle.
              <span className="inline-flex rounded-md bg-white px-4 py-2.5">
                <Image
                  src="/made-in-india.webp"
                  alt="Make in India"
                  width={420}
                  height={192}
                  sizes="120px"
                  className="h-auto w-[120px]"
                />
              </span>
            )}

            <Credit url={settings.agencyUrl} label={settings.agencyName}>
              <Image
                src="/aalitech-mark.png"
                alt={settings.agencyName}
                width={123}
                height={112}
                sizes="48px"
                className="h-auto w-12"
              />
            </Credit>

            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] tracking-[0.04em] text-[var(--ink-2)]">
              <span>
                {settings.agencyCredit}{' '}
                <Credit url={settings.agencyUrl} label={settings.agencyName} bold>
                  {settings.agencyName}
                </Credit>
              </span>
              {/* The second name is optional; with it cleared, one credit and no stray dot. */}
              {settings.maintainerName && (
                <>
                  <span aria-hidden="true" className="text-[var(--muted)]">
                    ·
                  </span>
                  <span>
                    {settings.maintainerCredit}{' '}
                    <Credit url={settings.maintainerUrl} label={settings.maintainerName} bold>
                      {settings.maintainerName}
                    </Credit>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
      <div className="border-t border-[var(--line)] px-5 py-6">
        <p className="mx-auto max-w-[1240px] text-center text-[11.5px] leading-relaxed text-[var(--muted)]">
          © {new Date().getFullYear()} The One Roof, Guntur. Wholesale &amp; retail. Prices include
          all taxes. This site takes no payments — every order is confirmed on WhatsApp and paid at
          the shop or on delivery.
        </p>
      </div>
    </footer>
  )
}

/** A credit name: a link when the settings give one, plain text otherwise. */
function Credit({
  url,
  label,
  bold,
  children,
}: {
  url?: string | null
  label: string
  bold?: boolean
  children: React.ReactNode
}) {
  const cls = `${bold ? 'font-semibold ' : ''}transition-colors hover:text-[var(--brass)]`
  if (!url) return <span className={bold ? 'font-semibold' : undefined}>{children}</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={bold ? undefined : label} className={cls}>
      {children}
    </a>
  )
}
