'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

/**
 * The actions column in the Products list: View, Edit and Delete on every
 * row, the way a shop owner expects from Amazon or Flipkart seller screens.
 *
 * Payload's own actions only appear in a bar at the bottom after rows are
 * ticked, which the client never found. That bar still works for many rows
 * at once; this is for the everyday one.
 */
type Row = { id?: number | string; slug?: string | null; title?: string | null; status?: string | null }

export function RowActions({ rowData }: { rowData?: Row }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!rowData?.id) return null
  const { id, slug, title, status } = rowData

  const remove = async () => {
    if (!window.confirm(`Delete "${title ?? 'this product'}"? It comes off the website straight away. This cannot be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' })
    setBusy(false)
    if (!res.ok) return window.alert('Could not delete it. Refresh the page and try again.')
    router.refresh()
  }

  return (
    <div className="tor-actions">
      {status === 'live' && slug ? (
        <a href={`/product/${slug}`} target="_blank" rel="noopener noreferrer" className="tor-actions__btn">
          View
        </a>
      ) : (
        <span className="tor-actions__btn is-off" title="Not on the website — it is a draft or hidden">
          View
        </span>
      )}
      <Link href={`/admin/collections/products/${id}`} className="tor-actions__btn">
        Edit
      </Link>
      <button type="button" onClick={remove} disabled={busy} className="tor-actions__btn is-danger">
        {busy ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}

export default RowActions
