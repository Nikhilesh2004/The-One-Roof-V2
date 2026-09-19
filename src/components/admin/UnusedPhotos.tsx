'use client'

import { Button } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import { api, Chip, pool, Progress } from './BulkUpload'

/**
 * Unused photos: the ones no product points at any more.
 *
 * Deleting a product leaves its photos behind — Payload deletes the product,
 * not the files it used — so they pile up after every clear-out and every
 * re-shoot. They stay reachable by direct link, fill the disk and bury the
 * photos that matter in the Photos list.
 *
 * "Used" means named in a product's photos or grid picture: the only two
 * fields in the whole config that point at a photo (Products.ts). A new
 * field that holds photos must be added to usedIds() below, or its photos
 * would be listed here as unused.
 *
 * Nothing goes without a click and a confirmation, and the list is worked
 * out again just before deleting, so a photo attached to a product in
 * another tab a minute ago is never taken.
 */

type Ref = number | string
type Media = {
  id: Ref
  filename?: string
  filesize?: number
  url?: string
  sizes?: { thumb?: { url?: string } }
}
type Phase = 'loading' | 'ready' | 'working' | 'done'

const BATCH = 25

async function usedIds(): Promise<Set<Ref>> {
  const { docs } = await api<{ docs: any[] }>(
    '/api/products?pagination=false&depth=0&select[photos]=true&select[thumbnail]=true',
  )
  const used = new Set<Ref>()
  for (const p of docs) {
    for (const id of p.photos ?? []) used.add(id)
    if (p.thumbnail != null) used.add(p.thumbnail)
  }
  return used
}

async function unusedPhotos(): Promise<{ unused: Media[]; total: number }> {
  const [used, media] = await Promise.all([
    usedIds(),
    api<{ docs: Media[] }>(
      '/api/media?pagination=false&depth=0&sort=filename&select[filename]=true&select[filesize]=true&select[url]=true&select[sizes]=true',
    ),
  ])
  return { unused: media.docs.filter((m) => !used.has(m.id)), total: media.docs.length }
}

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`

export function UnusedPhotos() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [unused, setUnused] = useState<Media[]>([])
  const [total, setTotal] = useState(0)
  const [picked, setPicked] = useState<Set<Ref>>(new Set())
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ label: '', done: 0, total: 0 })
  const [result, setResult] = useState({ deleted: 0, failed: 0, skipped: 0 })

  const load = useCallback(async () => {
    setPhase('loading')
    setError('')
    try {
      const r = await unusedPhotos()
      setUnused(r.unused)
      setTotal(r.total)
      setPicked(new Set(r.unused.map((m) => m.id)))
      setPhase('ready')
    } catch (e) {
      setError((e as Error).message)
      setPhase('ready')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (id: Ref) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const run = async () => {
    const n = picked.size
    if (!n) return
    if (!window.confirm(`Delete ${n} photo${n === 1 ? '' : 's'} for good? This cannot be undone.`)) return

    setPhase('working')
    setError('')
    let deleted = 0
    let failed = 0
    let skipped = 0
    try {
      // Checked again now: a photo may have been added to a product since.
      const used = await usedIds()
      const ids = [...picked].filter((id) => {
        if (used.has(id)) skipped++
        return !used.has(id)
      })
      const batches: Ref[][] = []
      for (let i = 0; i < ids.length; i += BATCH) batches.push(ids.slice(i, i + BATCH))

      setProgress({ label: 'Deleting photos', done: 0, total: ids.length })
      await pool(batches, 1, async (batch) => {
        const where = batch.map((id, i) => `where[id][in][${i}]=${encodeURIComponent(String(id))}`).join('&')
        try {
          const res = await api<{ docs?: unknown[]; errors?: unknown[] }>(`/api/media?${where}`, { method: 'DELETE' })
          deleted += res.docs?.length ?? 0
          failed += res.errors?.length ?? 0
        } catch {
          failed += batch.length
        }
        setProgress((p) => ({ ...p, done: deleted + failed }))
      })
    } catch (e) {
      setError((e as Error).message)
    }
    setResult({ deleted, failed, skipped })
    setPhase('done')
  }

  const pickedSize = unused.filter((m) => picked.has(m.id)).reduce((s, m) => s + (m.filesize ?? 0), 0)

  return (
    <div className="tor-bu">
      <header className="tor-bu__head">
        <div>
          <h1 className="tor-bu__title">Unused photos</h1>
          <p className="tor-bu__lede">
            Photos that no product uses — left behind when products are deleted or given new photos. Deleting them
            does not change anything on the website.
          </p>
        </div>
      </header>

      {error && (
        <p className="tor-bu__alert">
          Something went wrong: {error}{' '}
          <button type="button" className="tor-bu__link" onClick={load}>
            Try again
          </button>
        </p>
      )}

      {phase === 'loading' && <p className="tor-bu__note">Checking every product and photo…</p>}

      {phase === 'ready' && !error && unused.length === 0 && (
        <p className="tor-bu__note">Nothing to clean up. All {total} photos are used by a product.</p>
      )}

      {(phase === 'ready' || phase === 'working') && unused.length > 0 && (
        <section className="tor-bu__check">
          <div className="tor-bu__chips">
            <Chip tone="bad" value={unused.length} label={`unused, of ${total} photos`} />
            <Chip value={picked.size} label={`ticked (${mb(pickedSize)})`} />
            <button
              type="button"
              className="tor-bu__link"
              onClick={() => setPicked(picked.size ? new Set() : new Set(unused.map((m) => m.id)))}
              disabled={phase === 'working'}
            >
              {picked.size ? 'Untick all' : 'Tick all'}
            </button>
          </div>

          <div className="tor-up">
            {unused.map((m) => (
              <label key={m.id} className={`tor-up__tile${picked.has(m.id) ? ' is-picked' : ''}`}>
                <input
                  type="checkbox"
                  checked={picked.has(m.id)}
                  onChange={() => toggle(m.id)}
                  disabled={phase === 'working'}
                />
                <span className="tor-up__img">
                  {m.sizes?.thumb?.url || m.url ? <img src={m.sizes?.thumb?.url || m.url} alt="" loading="lazy" /> : null}
                </span>
                <span className="tor-up__name">{m.filename}</span>
              </label>
            ))}
          </div>

          <div className="tor-bu__go">
            {phase === 'working' ? (
              <Progress {...progress} />
            ) : (
              <Button buttonStyle="primary" disabled={!picked.size} onClick={run}>
                Delete {picked.size} photo{picked.size === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        </section>
      )}

      {phase === 'done' && (
        <section className="tor-bu__check">
          <h2 className="tor-bu__h2">Done</h2>
          <div className="tor-bu__chips">
            <Chip tone="good" value={result.deleted} label="deleted" />
            {result.skipped > 0 && <Chip value={result.skipped} label="kept — now used by a product" />}
            {result.failed > 0 && <Chip tone="bad" value={result.failed} label="could not be deleted" />}
          </div>
          <div className="tor-bu__go">
            <Button buttonStyle="secondary" onClick={load}>
              Check again
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default UnusedPhotos
