import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-[620px] place-items-center px-5 py-28 text-center">
      <p className="font-display text-6xl text-[var(--brass)]">404</p>
      <h1 className="mt-6 font-display text-2xl">That page is not on our shelves.</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--ink-2)]">
        The product may have sold out and been taken down, or the link may have a typo in it.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn">
          Browse the catalogue
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back to the home page
        </Link>
      </div>
    </div>
  )
}
