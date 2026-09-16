'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import type { Product } from '../payload-types'
import {
  EMPTY,
  OCCASION_OPTIONS,
  PRICE_BANDS,
  SORTS,
  countsFor,
  filterProducts,
  filtersToQuery,
  type Filters,
} from '../lib/filters'
import { ProductCard } from './ProductCard'
import { CloseIcon } from './Icons'

/**
 * The catalogue with its filter panel.
 *
 * Filtering happens in the browser, so the counts beside each option update
 * the moment you tick something and nothing reloads. The address bar is
 * kept in step, so a filtered view is still a link you can send someone —
 * and the first render is the server's, filtered from that same URL, so
 * the page is right before any JavaScript runs.
 */
export function Catalogue({
  products,
  initialFilters,
}: {
  products: Product[]
  initialFilters: Filters
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [panelOpen, setPanelOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const shown = useMemo(() => filterProducts(products, filters), [products, filters])
  const counts = useMemo(() => countsFor(products, filters), [products, filters])

  // Keep the URL in step without adding a history entry per tick — the back
  // button should leave the catalogue, not walk back through every filter.
  useEffect(() => {
    const query = filtersToQuery(filters)
    const target = `${pathname}${query}`
    if (target !== window.location.pathname + window.location.search) {
      router.replace(target, { scroll: false })
    }
  }, [filters, pathname, router])

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const toggleOccasion = (value: string) =>
    setFilters((f) => ({
      ...f,
      occasions: f.occasions.includes(value)
        ? f.occasions.filter((o) => o !== value)
        : [...f.occasions, value],
    }))

  const activeCount =
    (filters.price !== 'all' ? 1 : 0) + filters.occasions.length + (filters.inStock ? 1 : 0)

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* ── Filters ──────────────────────────────────────────────── */}
      <aside
        className={`${
          panelOpen ? 'fixed inset-0 z-50 overflow-y-auto bg-[var(--void)] p-5' : 'hidden'
        } lg:sticky lg:top-24 lg:z-auto lg:block lg:h-fit lg:overflow-visible lg:bg-transparent lg:p-0`}
        aria-label="Filters"
      >
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <h2 className="text-[13px] font-semibold tracking-[0.16em] uppercase">Filters</h2>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Close filters"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
          >
            <CloseIcon />
          </button>
        </div>

        <Group title="Price">
          <Radio
            name="price"
            checked={filters.price === 'all'}
            onChange={() => set('price', 'all')}
            label="Any price"
            count={counts.price.all}
          />
          {PRICE_BANDS.map((b) => (
            <Radio
              key={b.value}
              name="price"
              checked={filters.price === b.value}
              onChange={() => set('price', b.value)}
              label={b.label}
              count={counts.price[b.value] ?? 0}
            />
          ))}
        </Group>

        <Group title="Good for">
          {OCCASION_OPTIONS.map((o) => (
            <Check
              key={o.value}
              checked={filters.occasions.includes(o.value)}
              onChange={() => toggleOccasion(o.value)}
              label={o.label}
              count={counts.occasions[o.value] ?? 0}
            />
          ))}
        </Group>

        <Group title="Availability">
          <Check
            checked={filters.inStock}
            onChange={() => set('inStock', !filters.inStock)}
            label="In stock only"
            count={counts.inStock}
          />
        </Group>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => setFilters({ ...EMPTY, sort: filters.sort })}
            className="mt-2 text-[12px] text-[var(--brass)] underline underline-offset-4"
          >
            Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </button>
        )}

        {panelOpen && (
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="btn mt-7 w-full lg:hidden"
          >
            Show {shown.length} product{shown.length === 1 ? '' : 's'}
          </button>
        )}
      </aside>

      {/* ── Results ──────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-4">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="btn btn-ghost !px-4 !py-2.5 !text-[11px] lg:hidden"
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>

          <p className="text-[12.5px] text-[var(--muted)]" aria-live="polite">
            {shown.length} product{shown.length === 1 ? '' : 's'}
          </p>

          <label className="ml-auto flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
            Sort
            <select
              value={filters.sort}
              onChange={(e) => set('sort', e.target.value)}
              className="border border-[var(--line-2)] bg-[var(--surface)] px-3 py-2 text-[12.5px] text-[var(--ink)]"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {shown.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-[var(--ink-2)]">Nothing matches those filters.</p>
            <button
              type="button"
              onClick={() => setFilters({ ...EMPTY, sort: filters.sort })}
              className="btn btn-ghost mt-5"
            >
              Clear the filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {shown.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-6 border-b border-[var(--line)] pb-5 last-of-type:border-b-0">
      <legend className="mb-3 text-[10.5px] font-semibold tracking-[0.16em] text-[var(--ink-2)] uppercase">
        {title}
      </legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  )
}

function Row({
  children,
  label,
  count,
}: {
  children: React.ReactNode
  label: string
  count: number
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 text-[12.5px] ${
        count === 0 ? 'text-[var(--muted)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
      <span className="min-w-0 flex-1">{label}</span>
      <span className="flex-none text-[11px] text-[var(--muted)] tabular-nums">{count}</span>
    </label>
  )
}

function Radio({
  name,
  checked,
  onChange,
  label,
  count,
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
  count: number
}) {
  return (
    <Row label={label} count={count}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 flex-none accent-[var(--brass)]"
      />
    </Row>
  )
}

function Check({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean
  onChange: () => void
  label: string
  count: number
}) {
  return (
    <Row label={label} count={count}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 flex-none accent-[var(--brass)]"
      />
    </Row>
  )
}
