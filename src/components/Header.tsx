import Link from 'next/link'
import React from 'react'

import type { Category, Setting } from '../payload-types'
import { BagButton } from './BagButton'
import { MobileNav } from './MobileNav'
import { RoofMark } from './Icons'
import { SearchOverlay } from './SearchOverlay'
import { ThemeToggle } from './ThemeToggle'
import { WishlistLink } from './WishlistLink'

/**
 * Every control here does something: search, saved items, theme, bag.
 * v1 carried a Search and an Account icon with no handler behind either,
 * and a product-manager button that leaked to every visitor. The shop
 * signs in at /admin, which is not a thing shoppers ever see.
 */
export function Header({ categories, settings }: { categories: Category[]; settings: Setting }) {
  const navItems = [
    ...categories.map((c) => ({
      href: `/shop/${c.slug}`,
      label: c.shortName ?? c.name,
    })),
    { href: '/shop', label: 'All' },
  ]

  /*
   * The address is stored as a multi-line block for the footer. Flattened
   * naively it reads "5th Lane,, Guntur" — each line already ends in its
   * own comma — so trailing punctuation is stripped before joining.
   */
  const address = (settings.address ?? '')
    .split('\n')
    .map((line) => line.trim().replace(/,+$/, ''))
    .filter(Boolean)
    .join(', ')

  /*
   * On a phone the full address ran to three lines and pushed the shop
   * itself below the fold, so it is dropped there — it is still in the
   * footer, on /contact, and in the schema Google reads. The short facts
   * that make a shop worth trusting stay on every screen.
   */
  const bar: { text: string; phone: boolean }[] = [
    { text: address, phone: false },
    { text: settings.gstin ? `GSTIN ${settings.gstin}` : '', phone: true },
    { text: settings.announcement ?? '', phone: true },
    { text: settings.hours ?? '', phone: true },
  ].filter((i) => i.text)

  // Which item leads the strip once the phone-hidden ones are gone.
  const firstOnPhone = bar.findIndex((i) => i.phone)

  return (
    <>
      {/*
        One strip above the header carrying everything that makes the shop
        checkable: where it is, that it is GST-registered, the delivery
        promise and the hours. It is deliberately the ONLY such strip —
        a second one below the header crowded the navigation out.

        Not uppercased: it now holds an address and a GSTIN, and shouting
        those makes them harder to read, not more prominent.
      */}
      {bar.length > 0 && (
        <div className="border-b border-[var(--line)] bg-[var(--surface-2)] px-5 py-2 text-[11.5px] text-[var(--ink-2)]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center">
            {bar.map((item, i) => (
              <React.Fragment key={item.text}>
                {/*
                  A separator belongs before an item only when something
                  visible precedes it. On a phone the address is gone, so the
                  slash that used to sit before the GSTIN has to go with it —
                  otherwise the strip opens with a dangling "/".
                */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className={
                      item.phone && i > firstOnPhone
                        ? 'text-[var(--line)]'
                        : 'hidden text-[var(--line)] sm:inline'
                    }
                  >
                    /
                  </span>
                )}
                <span className={item.phone ? undefined : 'hidden sm:inline'}>{item.text}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--head-bg)] backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-[1240px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center font-display text-[17px] tracking-tight whitespace-nowrap sm:text-[19px]"
            aria-label="The One Roof — home"
          >
            <RoofMark className="mr-2 h-6 w-6" />
            The One&nbsp;<em className="text-[var(--brass)] not-italic">Roof</em>
          </Link>

          <nav aria-label="Sections" className="hidden min-w-0 flex-1 md:block">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[11.5px] font-medium tracking-[0.13em] text-[var(--ink-2)] uppercase transition-colors hover:text-[var(--ink)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex flex-none items-center gap-1">
            <SearchOverlay />
            <WishlistLink />
            <ThemeToggle />
            <BagButton />
            <MobileNav items={navItems} />
          </div>
        </div>
      </header>
    </>
  )
}
