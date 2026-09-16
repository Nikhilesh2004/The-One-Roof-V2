'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { CloseIcon, SearchIcon } from './Icons'

/**
 * A search control that actually searches. v1 had this icon with no
 * handler behind it; here it opens a field and lands on /search.
 */
export function SearchOverlay() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        aria-label="Search products"
      >
        <SearchIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="mx-auto mt-[14vh] w-[min(640px,92vw)]"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={submit}
              role="search"
              className="flex items-center gap-3 border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3"
            >
              <span className="text-[var(--muted)]">
                <SearchIcon size={20} />
              </span>
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type="search"
                placeholder="Search for a brass idol, a tote, a wall clock…"
                aria-label="Search products"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 flex-none place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Press Enter to search · Esc to close
            </p>
          </div>
        </div>
      )}
    </>
  )
}
