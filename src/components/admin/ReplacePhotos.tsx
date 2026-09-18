'use client'

import { Button } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { checkReplaceSheet, type ReplaceRow } from '../../lib/bulk-import'
import { api, Chip, ImagesPick, Pick, pool, Progress, readTable } from './BulkUpload'

/**
 * Replace photos: new pictures for products already in the shop.
 *
 * Same spreadsheet and same image picking as Bulk upload, one job only. Each
 * row finds its product by web address (or name) and sets its photos to what
 * the sheet lists. Every picked image is uploaded fresh, even when its name
 * matches a photo already on the site, because that is the whole point here.
 * Nothing but the photos and the grid picture is written, so a sheet with an
 * old price cannot undo a price changed in the CMS since.
 *
 * The old photos stay in the library: another product may use one, and a
 * wrong replacement can be put back by hand.
 */

type Ref = number | string
type Phase = 'pick' | 'working' | 'done'
type Result = { line: number; title: string; ok: boolean; note?: string }
type Media = { id: Ref; filename?: string; url?: string; sizes?: { thumb?: { url?: string } } }

const IMAGE_WORKERS = 3

const thumbOf = (m: unknown): string | null => {
  if (!m || typeof m !== 'object') return null
  const media = m as Media
  return media.sizes?.thumb?.url || media.url || null
}

export function ReplacePhotos() {
  const [existing, setExisting] = useState<Map<string, Ref>>(new Map())
  const [current, setCurrent] = useState<Map<string, string | null>>(new Map())
  const [library, setLibrary] = useState<Map<string, Ref>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [sheetFile, setSheetFile] = useState<File | null>(null)
  const [table, setTable] = useState<unknown[][] | null>(null)
  const [readError, setReadError] = useState('')
  const [images, setImages] = useState<Map<string, File>>(new Map())

  const [phase, setPhase] = useState<Phase>('pick')
  const [progress, setProgress] = useState({ label: '', done: 0, total: 0 })
  const [results, setResults] = useState<Result[]>([])

  const loadShop = useCallback(async () => {
    try {
      const [prods, media] = await Promise.all([
        api<{ docs: any[] }>(
          '/api/products?pagination=false&depth=1&select[slug]=true&select[photos]=true&select[thumbnail]=true',
        ),
        api<{ docs: any[] }>('/api/media?pagination=false&depth=0&select[filename]=true'),
      ])
      const withSlug = prods.docs.filter((p) => p.slug)
      setExisting(new Map(withSlug.map((p) => [p.slug, p.id])))
      setCurrent(new Map(withSlug.map((p) => [p.slug, thumbOf(p.thumbnail) ?? thumbOf(p.photos?.[0])])))
      setLibrary(new Map(media.docs.filter((m) => m.filename).map((m) => [m.filename, m.id])))
      setLoaded(true)
      setLoadError('')
    } catch (e) {
      setLoadError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    loadShop()
  }, [loadShop])

  const reset = () => {
    setResults([])
    setPhase('pick')
  }

  const pickSheet = async (file: File | undefined) => {
    if (!file) return
    setSheetFile(file)
    setReadError('')
    setTable(null)
    reset()
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
    reset()
  }

  const sheet = useMemo(() => {
    if (!table || !loaded) return null
    return checkReplaceSheet(table, {
      existing,
      files: [...images.keys()],
      library: new Set(library.keys()),
    })
  }, [table, loaded, existing, images, library])

  const ready = sheet?.rows.filter((r) => !r.errors.length) ?? []
  const broken = sheet?.rows.filter((r) => r.errors.length) ?? []
  const toUpload = [...new Set(ready.flatMap((r) => r.fresh))]

  const previews = useRef(new Map<string, string>())
  useEffect(() => {
    const urls = previews.current
    for (const [name, file] of images) if (!urls.has(name)) urls.set(name, URL.createObjectURL(file))
    return () => {
      for (const u of urls.values()) URL.revokeObjectURL(u)
      urls.clear()
    }
  }, [images])
  const newPicture = (r: ReplaceRow) => {
    const name = r.thumbnail ?? r.photos[0]
    if (!name) return null
    return previews.current.get(name) ?? (library.has(name) ? `/api/media/file/${encodeURIComponent(name)}` : null)
  }

  useEffect(() => {
    if (phase !== 'working') return
    const stop = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', stop)
    return () => window.removeEventListener('beforeunload', stop)
  }, [phase])

  const run = async () => {
    if (!ready.length) return
    setPhase('working')
    setResults([])

    const altFor = new Map<string, string>()
    for (const r of ready) for (const f of r.fresh) if (!altFor.has(f)) altFor.set(f, r.title)

    // Picked images always upload; anything else named is kept from the library.
    const ids = new Map<string, Ref>(library)
    const failedImages = new Map<string, string>()
    let uploaded = 0
    setProgress({ label: 'Uploading photos', done: 0, total: toUpload.length })

    await pool(toUpload, IMAGE_WORKERS, async (name) => {
      try {
        const form = new FormData()
        form.append('file', images.get(name)!)
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
      const missing = row.fresh.filter((f) => failedImages.has(f))
      if (missing.length) {
        out.push({
          line: row.line,
          title: row.title,
          ok: false,
          note: `Not changed — photo did not upload: ${missing.map((f) => `${f} (${failedImages.get(f)})`).join(', ')}`,
        })
      } else {
        try {
          await api(`/api/products/${row.existingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photos: row.photos.map((f) => ids.get(f)),
              thumbnail: row.thumbnail ? ids.get(row.thumbnail) : null,
            }),
          })
          out.push({ line: row.line, title: row.title, ok: true })
        } catch (e) {
          out.push({ line: row.line, title: row.title, ok: false, note: (e as Error).message })
        }
      }
      setProgress((p) => ({ ...p, done: i + 1 }))
    }

    setResults(out)
    setPhase('done')
    await loadShop()
  }

  const saved = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const shown = sheet
    ? [...sheet.rows].sort((a, b) => Number(!!b.errors.length) - Number(!!a.errors.length) || a.line - b.line)
    : []

  return (
    <div className="tor-bu">
      <header className="tor-bu__head">
        <div>
          <h1 className="tor-bu__title">Replace photos</h1>
          <p className="tor-bu__lede">
            New photos for products already on the site. Only the photos change — price, stock and text stay
            as they are.
          </p>
        </div>
        <Button el="anchor" url="/bulk-upload-template.xlsx" buttonStyle="secondary" size="small">
          Download the template
        </Button>
      </header>

      {loadError && (
        <p className="tor-bu__alert">
          Could not load the shop&rsquo;s products and photos: {loadError}{' '}
          <button type="button" className="tor-bu__link" onClick={loadShop}>
            Try again
          </button>
        </p>
      )}

      <div className="tor-bu__picks">
        <Pick
          n="1"
          title="The spreadsheet"
          hint="Only the products to change: slug or title, and the photo columns"
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
          hint="The new photos, named as in the sheet"
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

          {sheet.rows.length > 0 && (
            <>
              <div className="tor-bu__chips">
                <Chip tone="good" value={ready.length} label="products to change" />
                {broken.length > 0 && <Chip tone="bad" value={broken.length} label="with problems" />}
                <Chip value={toUpload.length} label="new photos to upload" />
              </div>

              <div className="tor-bu__tablewrap">
                <table className="tor-bu__table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Now</th>
                      <th>New</th>
                      <th>Product</th>
                      <th>What happens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => {
                      const before = current.get(r.slug)
                      const after = newPicture(r)
                      return (
                        <tr key={r.line} className={r.errors.length ? 'is-bad' : ''}>
                          <td className="tor-bu__num">{r.line}</td>
                          <td>
                            <div className="tor-thumb">{before ? <img src={before} alt="" loading="lazy" /> : null}</div>
                          </td>
                          <td>
                            <div className="tor-thumb">{after ? <img src={after} alt="" loading="lazy" /> : null}</div>
                          </td>
                          <td>
                            <strong>{r.title || '—'}</strong>
                            <span className="tor-bu__sub">
                              {r.photos.length} photo{r.photos.length === 1 ? '' : 's'}, {r.fresh.length} new
                              {r.thumbnail ? ' + grid picture' : ''}
                            </span>
                          </td>
                          <td>
                            {r.errors.length ? (
                              <span className="tor-bu__badge is-bad">Not changed</span>
                            ) : (
                              <span className="tor-bu__badge is-update">Replace</span>
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
                      Replace photos on {ready.length} product{ready.length === 1 ? '' : 's'}
                    </Button>
                    {broken.length > 0 && (
                      <span className="tor-bu__sub">The {broken.length} with problems will be left as they are.</span>
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
            <Chip tone="good" value={saved.length} label="products changed" />
            {failed.length > 0 && <Chip tone="bad" value={failed.length} label="not changed" />}
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
            <Button
              buttonStyle="secondary"
              onClick={() => {
                // A second press would upload the same pictures again.
                setImages(new Map())
                reset()
              }}
            >
              Replace more
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default ReplacePhotos
