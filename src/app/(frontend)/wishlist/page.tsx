import type { Metadata } from 'next'
import React from 'react'

import { SavedList } from '../../../components/SavedList'

export const metadata: Metadata = {
  title: 'Saved items',
  robots: { index: false },
}

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)]">Saved items</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-2)]">
        Kept on this device — no account needed. Clearing your browser data clears this list.
      </p>
      <SavedList />
    </div>
  )
}
