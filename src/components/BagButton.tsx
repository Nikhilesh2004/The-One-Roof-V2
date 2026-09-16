'use client'

import React from 'react'

import { useBag } from '../lib/bag'
import { BagIcon } from './Icons'

export function BagButton() {
  const { count, setOpen, ready } = useBag()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative grid h-10 w-10 place-items-center rounded-full text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? '' : 's'}` : 'Open bag'}
    >
      <BagIcon />
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--brass)] px-1 text-[10px] font-bold text-[var(--on-brass)]">
          {count}
        </span>
      )}
    </button>
  )
}
