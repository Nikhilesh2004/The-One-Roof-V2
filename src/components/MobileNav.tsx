'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { CloseIcon, MenuIcon } from './Icons'

type Item = { href: string; label: string }

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Navigating should close the menu, or the new page opens behind it.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] md:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <CloseIcon size={20} /> : <MenuIcon />}
      </button>

      {open && (
        <nav
          aria-label="Sections"
          className="absolute inset-x-0 top-full border-b border-[var(--line)] bg-[var(--surface)] md:hidden"
        >
          <ul className="mx-auto max-w-[1240px] px-5 py-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-[var(--line)] py-3.5 text-sm tracking-[0.1em] uppercase last:border-b-0 hover:text-[var(--brass)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
