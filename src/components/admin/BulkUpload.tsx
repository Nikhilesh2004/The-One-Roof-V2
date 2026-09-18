'use client'

import { Button } from '@payloadcms/ui'
import Papa from 'papaparse'
import { readSheet } from 'read-excel-file/browser'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  checkSheet,
  imagesNeeded,
  productData,
  stemOf,
  type CheckedRow,
  type Section,
} from '../../lib/bulk-import'

/**
 * Bulk upload: a spreadsheet and a folder of images in, products out.
 *
 * Nothing is saved until the preview is clean enough to press Import. Every
 * row is checked first — against the real sections, the real photo library
 * and the products already in the shop — and shown with what will happen to
 * it: new, updated, or not imported and why. The checking lives in
 * lib/bulk-import.ts; this file is the screen and the network.
 *
 * Re-running the same sheet is safe by design. A product is matched on its
 * web address and updated rather than duplicated, and a photo already in the
 * library is reused rather than uploaded again — so an import cut short by a
 * dropped connection is finished by simply running it again.
 *
 * "Already in the library" means the same name and the same size. A picked
 * image that shares a name with a library photo but differs in size is a new
 * picture (a reshoot, or the ChatGPT-cleaned version), so it is uploaded and
 * the product switched to it. The old photo stays in the library, untouched,
 * for any other product still using it.
 *
 * Everything goes through Payload's own REST API with the logged-in session,
 * so the collection's access rules and hooks apply exactly as they would to a
 * product saved by hand.
 */

type Ref = number | string
type Result = { line: number; title: string; ok: boolean; action: 'create' | 'update'; note?: string }
type Phase = 'pick' | 'working' | 'done'

const IMAGE_WORKERS = 3

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(explain(body) || `The server said ${res.status}.`)
  return body as T
}

/** Payload's error bodies, flattened into one readable sentence. */
function explain(body: any): string {
  const out: string[] = []
  for (const e of body?.errors ?? []) {
    const fields = e?.data?.errors
    if (Array.isArray(fields) && fields.length) {
      for (const f of fields) out.push(f.path ? `${f.path}: ${f.message}` : f.message)
    } else if (e?.message) out.push(e.message)
  }
  return out.join(' ')
}

export async function readTable(file: File): Promise<unknown[][]> {
  if (/\.csv$/i.test(file.name)) {
    return new Promise((resolve, reject) =>
      Papa.parse<unknown[]>(file, {
        skipEmptyLines: true,
        complete: (r) => resolve(r.data),
        error: (e) => reject(e),
      }),
    )
  }
  // The template keeps its instructions on other sheets; read Products by
  // name, and fall back to the first sheet for a file someone made themselves.
  try {
    return (await readSheet(file, 'Products')) as unknown[][]
  } catch {
    return (await readSheet(file)) as unknown[][]
  }
}

/** Run `work` over `items`, `n` at a time. */
export async function pool<T>(items: T[], n: number, work: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) await work(items[next++])
    }),
  )
}

export function BulkUpload() {
  const [sections, setSections] = useState<Section[] | null>(null)
  const [existing, setExisting] = useState<Map<string, Ref>>(new Map())
  const [library, setLibrary] = useState<Map<string, { id: Ref; size: number }>>(new Map())
  const [loadError, setLoadError] = useState('')

  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [table, setTable] = useState<unknown[][] | null>(null)
  const [readError, setReadError] = useState('')
  const [images, setImages] = useState<Map<string, File>>(new Map())

  const [onlyProblems, setOnlyProblems] = useState(false)
  const [phase, setPhase] = useState<Phase>('pick')
  const [progress, setProgress] = useState({ label: '', done: 0, total: 0 })
  const [results, setResults] = useState<Result[]>([])

  // ── What is already in the shop ──────────────────────────────────────
  const loadShop = useCallback(async () => {
    try {
      const [cats, prods, media] = await Promise.all([
        api<{ docs: any[] }>('/api/categories?pagination=false&depth=0&sort=order'),
        api<{ docs: any[] }>('/api/products?pagination=false&depth=0&select[slug]=true'),
        api<{ docs: any[] }>('/api/media?pagination=false&depth=0&select[filename]=true&select[filesize]=true'),
      ])
      setSections(cats.docs.map((c) => ({ id: c.id, slug: c.slug, name: c.name })))
      setExisting(new Map(prods.docs.filter((p) => p.slug).map((p) => [p.slug, p.id])))
      setLibrary(
        new Map(media.docs.filter((m) => m.filename).map((m) => [m.filename, { id: m.id, size: m.filesize }])),
      )
      setLoadError('')
    } catch (e) {
      setLoadError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    loadShop()
  }, [loadShop])

  // ── Picking ──────────────────────────────────────────────────────────
  const pickSheet = async (file: File | undefined) => {
    if (!file) return
    setSheetFile(file)
    setReadError('')
    setTable(null)
    setResults([])
    setPhase('pick')
    try {
      setTable(await readTable(file))
    } catch {
      setReadError(`Could not read ${file.name}. Save it as .xlsx (or .csv) and try again.`)
    }
  }

  const addImages = (list: FileList | null) => {
    if (!list?.length) return
    setImages((prev) => {
      const next = new Map(prev)
      for (const f of Array.from(list)) if (f.type.startsWith('image/')) next.set(f.name, f)
      return next
    })
    setResults([])
    setPhase('pick')
  }

  // ── Checking ─────────────────────────────────────────────────────────
  const libraryNames = useMemo(() => new Set(library.keys()), [library])

  // The library photo an image name stands for, when it needs no upload: the
  // same file already there, under its own name or a clash-renamed one.
  const inLibrary = useMemo(() => {
    const bySame = new Map<string, Ref>()
    for (const [name, m] of library) bySame.set(`${stemOf(name)}|${m.size}`, m.id)
    return (name: string): Ref | undefined => {
      const file = images.get(name)
      if (!file) return library.get(name)?.id
      const same = library.get(name)
      if (same?.size === file.size) return same.id
      return bySame.get(`${stemOf(name)}|${file.size}`)
    }
  }, [library, images])

  const sheet = useMemo(() => {
    if (!table || !sections) return null
    return checkSheet(table, {
      sections,
      existing,
      files: [...images.keys()],
      library: libraryNames,
    })
  }, [table, sections, existing, images, libraryNames])

  const ready = sheet?.rows.filter((r) => !r.errors.length) ?? []
  const broken = sheet?.rows.filter((r) => r.errors.length) ?? []
  const toUpload = sheet ? imagesNeeded(ready, (n) => inLibrary(n) !== undefined) : []
  const replacing = toUpload.filter((n) => library.has(n)).length

  // Local previews for picked images; library images come from the server.
  const previews = useRef(new Map<string, string>())
  useEffect(() => {
    const urls = previews.current
    for (const [name, file] of images) if (!urls.has(name)) urls.set(name, URL.createObjectURL(file))
    return () => {
      for (const u of urls.values()) URL.revokeObjectURL(u)
      urls.clear()
    }
  }, [images])
  const previewOf = (row: CheckedRow) => {
    const name = row.thumbnail ?? row.photos[0]
    if (!name) return null
    return previews.current.get(name) ?? (library.has(name) ? `/api/media/file/${encodeURIComponent(name)}` : null)
  }

  // Leaving mid-import would strand half a batch; ask first.
  useEffect(() => {
    if (phase !== 'working') return
    const stop = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', stop)
    return () => window.removeEventListener('beforeunload', stop)
  }, [phase])

  // ── Importing ────────────────────────────────────────────────────────
  const run = async () => {
    if (!ready.length) return
    setPhase('working')
    setResults([])

    // Each image is uploaded once, named after the first product that uses it.
    const altFor = new Map<string, string>()
    for (const r of ready) {
      for (const f of [...r.photos, ...(r.thumbnail ? [r.thumbnail] : [])]) {
        if (!altFor.has(f)) altFor.set(f, r.title)
      }
    }

    const ids = new Map<string, Ref>()
    for (const name of altFor.keys()) {
      const id = inLibrary(name)
      if (id !== undefined) ids.set(name, id)
    }
    const failedImages = new Map<string, string>()
    let uploaded = 0
    setProgress({ label: 'Uploading photos', done: 0, total: toUpload.length })

    await pool(toUpload, IMAGE_WORKERS, async (name) => {
      const file = images.get(name)
      try {
        if (!file) throw new Error('not among the images picked')
        const form = new FormData()
        form.append('file', file)
        form.append('_payload', JSON.stringify({ alt: altFor.get(name) }))
        const { doc } = await api<{ doc: { id: Ref } }>('/api/media', { method: 'POST', body: form })
        ids.set(name, doc.id)
      } catch (e) {
        failedImages.set(name, (e as Error).message)
      }
      setProgress((p) => ({ ...p, done: ++uploaded }))
    })

    const out: Result[] = []
    setProgress({ label: 'Saving products', done: 0, total: ready.length })

    for (const [i, row] of ready.entries()) {
      const missing = [...row.photos, ...(row.thumbnail ? [row.thumbnail] : [])].filter((f) =>
        failedImages.has(f),
      )
      if (missing.length) {
        out.push({
          line: row.line,
          title: row.title,
          ok: false,
          action: row.action,
          note: `Not saved — photo did not upload: ${missing.map((f) => `${f} (${failedImages.get(f)})`).join(', ')}`,
        })
      } else {
        try {
          const body = JSON.stringify(productData(row, ids))
          const headers = { 'Content-Type': 'application/json' }
          if (row.existingId !== undefined) {
            await api(`/api/products/${row.existingId}`, { method: 'PATCH', headers, body })
          } else {
            await api('/api/products', { method: 'POST', headers, body })
          }
          out.push({ line: row.line, title: row.title, ok: true, action: row.action })
        } catch (e) {
          out.push({ line: row.line, title: row.title, ok: false, action: row.action, note: (e as Error).message })
        }
      }
      setProgress((p) => ({ ...p, done: i + 1 }))
    }

    setResults(out)
    setPhase('done')
    // So the preview reflects what is now in the shop: a second run shows
    // updates, and nothing already uploaded is offered again.
    await loadShop()
  }

  // ── Screen ───────────────────────────────────────────────────────────
  const saved = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const shown = sheet
    ? [...sheet.rows]
        .sort((a, b) => Number(!!b.errors.length) - Number(!!a.errors.length) || a.line - b.line)
        .filter((r) => !onlyProblems || r.errors.length || r.warnings.length)
    : []

  return (
    <div className="tor-bu">
      <header className="tor-bu__head">
        <div>
          <h1 className="tor-bu__title">Bulk upload</h1>
          <p className="tor-bu__lede">
            Add or update many products at once. Nothing is saved until you have checked the preview.
          </p>
        </div>
        <Button el="anchor" url="/bulk-upload-template.xlsx" buttonStyle="secondary" size="small">
          Download the template
        </Button>
      </header>

      {loadError && (
        <p className="tor-bu__alert">
          Could not load the shop&rsquo;s sections and photos: {loadError}{' '}
          <button type="button" className="tor-bu__link" onClick={loadShop}>
            Try again
          </button>
        </p>
      )}

      <div className="tor-bu__picks">
        <Pick
          n="1"
          title="The spreadsheet"
          hint="The filled-in template, .xlsx or .csv"
          done={sheetFile ? sheetFile.name : ''}
        >
          <label className="tor-bu__file">
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => pickSheet(e.target.files?.[0])}
              disabled={phase === 'working'}
            />
            {sheetFile ? 'Choose a different file' : 'Choose file'}
          </label>
        </Pick>

        <ImagesPick
          count={images.size}
          hint="Every photo and thumbnail named in the sheet"
          busy={phase === 'working'}
          onAdd={addImages}
          onClear={() => setImages(new Map())}
        />
      </div>

      {readError && <p className="tor-bu__alert">{readError}</p>}

      {sheet && phase !== 'done' && (
        <section className="tor-bu__check">
          <h2 className="tor-bu__h2">3. Check</h2>

          {sheet.fileErrors.map((e) => (
            <p className="tor-bu__alert" key={e}>
              {e}
            </p>
          ))}
          {sheet.fileWarnings.map((w) => (
            <p className="tor-bu__note" key={w}>
              {w}
            </p>
          ))}

          {sheet.rows.length > 0 && (
            <>
              <div className="tor-bu__chips">
                <Chip tone="good" value={ready.length} label="ready" />
                {broken.length > 0 && <Chip tone="bad" value={broken.length} label="with problems" />}
                <Chip value={ready.filter((r) => r.action === 'create').length} label="new" />
                <Chip value={ready.filter((r) => r.action === 'update').length} label="updates" />
                <Chip value={toUpload.length} label="images to upload" />
                {replacing > 0 && <Chip value={replacing} label="replace photos already on the site" />}
                <label className="tor-bu__toggle">
                  <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                  Show only rows with notes
                </label>
              </div>

              <div className="tor-bu__tablewrap">
                <table className="tor-bu__table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Picture</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>What happens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => {
                      const src = previewOf(r)
                      return (
                        <tr key={r.line} className={r.errors.length ? 'is-bad' : ''}>
                          <td className="tor-bu__num">{r.line}</td>
                          <td>
                            <div className="tor-thumb">
                              {src ? <img src={src} alt="" loading="lazy" /> : null}
                            </div>
                          </td>
                          <td>
                            <strong>{r.title || '—'}</strong>
                            <span className="tor-bu__sub">
                              {r.photos.length} photo{r.photos.length === 1 ? '' : 's'}
                              {r.thumbnail ? ' + grid picture' : ''}
                            </span>
                          </td>
                          <td className="tor-bu__num">{r.price ?? '—'}</td>
                          <td className="tor-bu__num">{r.stock ?? '—'}</td>
                          <td>{r.status}</td>
                          <td>
                            {r.errors.length ? (
                              <span className="tor-bu__badge is-bad">Not imported</span>
                            ) : (
                              <span className={`tor-bu__badge ${r.action === 'create' ? 'is-new' : 'is-update'}`}>
                                {r.action === 'create' ? 'New' : 'Update'}
                              </span>
                            )}
                            {r.errors.map((e) => (
                              <span className="tor-bu__msg is-bad" key={e}>
                                {e}
                              </span>
                            ))}
                            {r.warnings.map((w) => (
                              <span className="tor-bu__msg" key={w}>
                                {w}
                              </span>
                            ))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="tor-bu__go">
                {phase === 'working' ? (
                  <Progress {...progress} />
                ) : (
                  <>
                    <Button buttonStyle="primary" disabled={!ready.length} onClick={run}>
                      {broken.length
                        ? `Import ${ready.length} ready product${ready.length === 1 ? '' : 's'}`
                        : `Import ${ready.length} product${ready.length === 1 ? '' : 's'}`}
                    </Button>
                    {broken.length > 0 && (
                      <span className="tor-bu__sub">
                        The {broken.length} with problems will be skipped. Fix them in the sheet and upload it again —
                        the rest will just be updated.
                      </span>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {phase === 'done' && (
        <section className="tor-bu__check">
          <h2 className="tor-bu__h2">Done</h2>
          <div className="tor-bu__chips">
            <Chip tone="good" value={saved.length} label="saved" />
            <Chip value={saved.filter((r) => r.action === 'create').length} label="new" />
            <Chip value={saved.filter((r) => r.action === 'update').length} label="updated" />
            {failed.length > 0 && <Chip tone="bad" value={failed.length} label="not saved" />}
          </div>

          {failed.length > 0 && (
            <ul className="tor-bu__fails">
              {failed.map((r) => (
                <li key={r.line}>
                  <strong>
                    Row {r.line}: {r.title}
                  </strong>{' '}
                  — {r.note}
                </li>
              ))}
            </ul>
          )}

          <div className="tor-bu__go">
            <Button el="link" url="/admin/collections/products" buttonStyle="primary">
              See the products
            </Button>
            <Button buttonStyle="secondary" onClick={() => setPhase('pick')}>
              Back to the preview
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export function Pick({
  n,
  title,
  hint,
  done,
  children,
}: {
  n: string
  title: string
  hint: string
  done: string
  children: React.ReactNode
}) {
  return (
    <div className={`tor-bu__pick${done ? ' is-done' : ''}`}>
      <div className="tor-bu__pickhead">
        <span className="tor-step__n">{done ? '✓' : n}</span>
        <div>
          <strong>{title}</strong>
          <span className="tor-bu__sub">{done || hint}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

export function ImagesPick({
  count,
  hint,
  busy,
  onAdd,
  onClear,
}: {
  count: number
  hint: string
  busy: boolean
  onAdd: (files: FileList | null) => void
  onClear: () => void
}) {
  return (
    <Pick n="2" title="The images" hint={hint} done={count ? `${count} image${count === 1 ? '' : 's'} picked` : ''}>
      <div
        className="tor-bu__drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onAdd(e.dataTransfer.files)
        }}
      >
        <label className="tor-bu__file">
          <input type="file" accept="image/*" multiple onChange={(e) => onAdd(e.target.files)} disabled={busy} />
          Choose images
        </label>
        <label className="tor-bu__file">
          <input
            type="file"
            // A whole folder in one go — the photo team's folder as sent.
            {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
            onChange={(e) => onAdd(e.target.files)}
            disabled={busy}
          />
          Choose a folder
        </label>
        <span className="tor-bu__or">or drop them here</span>
      </div>
      {count > 0 && !busy && (
        <button type="button" className="tor-bu__link" onClick={onClear}>
          Clear images
        </button>
      )}
    </Pick>
  )
}

export function Chip({ value, label, tone }: { value: number; label: string; tone?: 'good' | 'bad' }) {
  return (
    <span className={`tor-bu__chip${tone ? ` is-${tone}` : ''}`}>
      <b>{value}</b> {label}
    </span>
  )
}

export function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 100
  return (
    <div className="tor-bu__progress">
      <span>
        {label}… {done} of {total}. Keep this page open.
      </span>
      <div className="tor-bu__bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default BulkUpload
