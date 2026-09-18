/**
 * Bulk upload: reading and checking the spreadsheet.
 *
 * Pure on purpose — no fetch, no Payload — so it can be exercised against a
 * real export from a plain script before anyone presses Import. The admin
 * page (components/admin/BulkUpload.tsx) does the network half.
 *
 * The rule throughout is forgiving where the intent is obvious and strict
 * where a guess would corrupt the shop:
 *
 *   "3,950" or "Rs 3950"       -> 3950, silently. The meaning is clear.
 *   "Pooja Items" as category  -> pooja. Same.
 *   Krishna-01.JPG vs krishna-01.jpg -> the real file, with a warning.
 *   a price of "abc", a section that does not exist, a missing photo
 *                              -> an error. The row does not import.
 *
 * Column names match scripts/build-template.py, which writes the template.
 */
import { slugify } from '../fields/slug'

export const PHOTO_COLUMNS = ['photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5', 'photo_6']
export const OCCASIONS = ['birthday', 'wedding', 'festival', 'everyday'] as const
export const STATUSES = ['live', 'draft', 'hidden'] as const

const TEXT_COLUMNS = [
  'subCategory',
  'description',
  'countryOfOrigin',
  'manufacturer',
  'genericName',
  'netQuantity',
  'dimensions',
  'weight',
  'finish',
  'shortCaption',
  'shortSticker',
] as const

export const KNOWN_COLUMNS = [
  'title',
  ...PHOTO_COLUMNS,
  'thumbnail',
  'price',
  'mrp',
  'stock',
  'category',
  ...TEXT_COLUMNS,
  'occasions',
  'monthYearOfImport',
  'status',
  'featured',
  'slug',
]
const REQUIRED_COLUMNS = ['title', 'photo_1', 'price', 'stock', 'category']

export type Section = { id: number | string; slug: string; name: string }

export type ProductRow = {
  line: number
  title: string
  slug: string
  photos: string[]
  thumbnail: string | null
  price: number | null
  mrp: number | null
  stock: number | null
  /** The section's own id, kept as the type the database uses. */
  category: Section['id'] | null
  occasions: string[]
  status: (typeof STATUSES)[number]
  featured: boolean
  monthYearOfImport: string
  text: Partial<Record<(typeof TEXT_COLUMNS)[number], string>>
}

export type CheckedRow = ProductRow & {
  errors: string[]
  warnings: string[]
  action: 'create' | 'update'
  existingId?: number | string
}

export type Sheet = {
  rows: CheckedRow[]
  fileErrors: string[]
  fileWarnings: string[]
}

export type Context = {
  sections: Section[]
  /** Product web addresses already in the shop -> their id. */
  existing: Map<string, number | string>
  /** Filenames of the images picked alongside the sheet. */
  files: string[]
  /** Filenames already in the photo library, which need no re-upload. */
  library: Set<string>
}

// ── Cell readers ──────────────────────────────────────────────────────

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === ''

const str = (v: unknown): string => {
  if (blank(v)) return ''
  if (v instanceof Date) return monthYear(v)
  return String(v).trim()
}

/** Excel turns "09/2026" into a date; put it back the way it was typed. */
const monthYear = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

/** A price or count as typed by a person: tolerate "3,950", "Rs 3950", "₹3950". */
const num = (v: unknown): number | null | 'bad' => {
  if (blank(v)) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : 'bad'
  const cleaned = String(v).replace(/rs\.?|inr|₹|,|\s/gi, '')
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return 'bad'
  return Number(cleaned)
}

const yes = (v: unknown) => /^(yes|y|true|1)$/i.test(str(v))

// ── Headers ───────────────────────────────────────────────────────────

/**
 * Map whatever header the sheet has onto a known column. Case and spacing
 * are forgiven ("Photo 1", "PHOTO_1" -> photo_1); anything unrecognised is
 * reported once rather than silently dropped.
 */
export function readHeaders(headers: unknown[]) {
  const squash = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '')
  const lookup = new Map(KNOWN_COLUMNS.map((c) => [squash(c), c]))
  const map: (string | null)[] = []
  const unknown: string[] = []
  for (const h of headers) {
    const name = str(h)
    const hit = name ? lookup.get(squash(name)) : undefined
    map.push(hit ?? null)
    if (name && !hit) unknown.push(name)
  }
  const missing = REQUIRED_COLUMNS.filter((c) => !map.includes(c))
  return { map, unknown, missing }
}

// ── Rows ──────────────────────────────────────────────────────────────

export function checkSheet(table: unknown[][], ctx: Context): Sheet {
  const fileErrors: string[] = []
  const fileWarnings: string[] = []

  if (!table.length) return { rows: [], fileErrors: ['The sheet is empty.'], fileWarnings }

  const { map, unknown, missing } = readHeaders(table[0])
  if (missing.length) {
    fileErrors.push(
      `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
        'Use the template from the CMS so the headings match.',
    )
    return { rows: [], fileErrors, fileWarnings }
  }
  if (unknown.length) fileWarnings.push(`Ignored columns: ${unknown.join(', ')}.`)

  const findFile = fileFinder(ctx)

  const sectionBy = new Map<string, Section>()
  for (const s of ctx.sections) {
    sectionBy.set(s.slug.toLowerCase(), s)
    sectionBy.set(s.name.toLowerCase(), s)
  }

  const seen = new Map<string, number>()
  const rows: CheckedRow[] = []

  table.slice(1).forEach((cells, i) => {
    const line = i + 2
    if (cells.every(blank)) return

    const cell: Record<string, unknown> = {}
    map.forEach((col, j) => {
      if (col) cell[col] = cells[j]
    })

    const errors: string[] = []
    const warnings: string[] = []

    const title = str(cell.title)
    if (!title) errors.push('No product name.')

    const slug = slugify(str(cell.slug) || title)
    if (title && !slug) errors.push('The product name has no letters or numbers to make a web address from.')
    if (slug && seen.has(slug)) {
      errors.push(`Same web address as row ${seen.get(slug)} — two products cannot share one.`)
    } else if (slug) {
      seen.set(slug, line)
    }

    const { photos, thumbnail } = rowImages(cell, findFile, errors, warnings)

    const price = num(cell.price)
    if (price === 'bad') errors.push(`Price "${str(cell.price)}" is not a number.`)
    else if (price === null) errors.push('No price.')
    else if (price <= 0) errors.push('Price must be more than 0.')

    const mrp = num(cell.mrp)
    if (mrp === 'bad') errors.push(`MRP "${str(cell.mrp)}" is not a number.`)
    else if (mrp !== null && typeof price === 'number' && mrp < price) {
      warnings.push(`MRP (${mrp}) is lower than the price (${price}), so no discount will show.`)
    }

    const stock = num(cell.stock)
    if (stock === 'bad') errors.push(`Stock "${str(cell.stock)}" is not a number.`)
    else if (stock === null) errors.push('No stock count. Use 0 if there are none.')
    else if (stock < 0 || !Number.isInteger(stock)) errors.push('Stock must be a whole number, 0 or more.')

    const section = sectionBy.get(str(cell.category).toLowerCase())
    if (!str(cell.category)) errors.push('No section.')
    else if (!section) {
      errors.push(
        `Section "${str(cell.category)}" does not exist. Use one of: ${ctx.sections.map((s) => s.slug).join(', ')}.`,
      )
    }

    let status = str(cell.status).toLowerCase() as ProductRow['status']
    if (!status) {
      status = 'draft'
      warnings.push('No status — saved as a draft, not shown on the website.')
    } else if (!STATUSES.includes(status)) {
      errors.push(`Status "${str(cell.status)}" must be live, draft or hidden.`)
    }
    if (status === 'live' && photos.length === 0) {
      errors.push('A live product needs at least one photo.')
    } else if (photos.length === 0) {
      warnings.push('No photos yet — it cannot go live until it has one.')
    }

    const occasions: string[] = []
    for (const o of str(cell.occasions).split(/[;,]/)) {
      const v = o.trim().toLowerCase()
      if (!v) continue
      if ((OCCASIONS as readonly string[]).includes(v)) occasions.push(v)
      else warnings.push(`Occasion "${o.trim()}" is not one of ${OCCASIONS.join(', ')} — left out.`)
    }

    const text: ProductRow['text'] = {}
    for (const c of TEXT_COLUMNS) {
      const v = str(cell[c])
      if (v) text[c] = v
    }

    const existingId = slug ? ctx.existing.get(slug) : undefined

    rows.push({
      line,
      title,
      slug,
      photos,
      thumbnail,
      price: typeof price === 'number' ? price : null,
      mrp: typeof mrp === 'number' ? mrp : null,
      stock: typeof stock === 'number' ? stock : null,
      category: section ? section.id : null,
      occasions,
      status,
      featured: yes(cell.featured),
      monthYearOfImport: str(cell.monthYearOfImport),
      text,
      errors,
      warnings,
      action: existingId !== undefined ? 'update' : 'create',
      existingId,
    })
  })

  if (!rows.length && !fileErrors.length) fileErrors.push('The sheet has headings but no products.')
  return { rows, fileErrors, fileWarnings }
}

// ── Images ────────────────────────────────────────────────────────────

/**
 * A photo is fine if it was picked now, or is already in the library from an
 * earlier run. Exact filename first; failing that, a unique match ignoring
 * capitals, with a warning. Anything else cannot be attached.
 */
function fileFinder(ctx: Pick<Context, 'files' | 'library'>) {
  const exact = new Set(ctx.files)
  const folded = new Map<string, string[]>()
  for (const f of ctx.files) {
    const k = f.toLowerCase()
    folded.set(k, [...(folded.get(k) ?? []), f])
  }
  return (name: string, label: string, errors: string[], warnings: string[]): string | null => {
    if (exact.has(name) || ctx.library.has(name)) return name
    const near = folded.get(name.toLowerCase())
    if (near?.length === 1) {
      warnings.push(`${label}: using ${near[0]} for ${name} (capitals differ).`)
      return near[0]
    }
    errors.push(`${label}: ${name} is not among the images you picked.`)
    return null
  }
}

function rowImages(
  cell: Record<string, unknown>,
  findFile: ReturnType<typeof fileFinder>,
  errors: string[],
  warnings: string[],
) {
  const photos: string[] = []
  for (const col of PHOTO_COLUMNS) {
    const name = str(cell[col])
    if (!name) continue
    const got = findFile(name, col, errors, warnings)
    if (got) photos.push(got)
  }
  const thumbName = str(cell.thumbnail)
  const thumbnail = thumbName ? findFile(thumbName, 'thumbnail', errors, warnings) : null
  return { photos, thumbnail }
}

// ── Replace photos ────────────────────────────────────────────────────

export type ReplaceRow = {
  line: number
  title: string
  slug: string
  photos: string[]
  thumbnail: string | null
  /** The images in this row that were picked now, and will be uploaded. */
  fresh: string[]
  existingId?: number | string
  errors: string[]
  warnings: string[]
}

/**
 * The same template, read for one job only: give existing products new
 * photos. Only the product's name or web address and the image columns are
 * read. Price, stock, text and the rest are ignored, so an old export can be
 * reused without undoing edits made in the CMS since.
 *
 * The sheet says what the product's photos are afterwards, in order. A photo
 * named but not picked is kept from the library, so a row can swap photo_1
 * alone. A blank thumbnail clears the grid picture, so the grid falls back
 * to the new photo_1, as the template says.
 */
export function checkReplaceSheet(
  table: unknown[][],
  ctx: Pick<Context, 'existing' | 'files' | 'library'>,
): { rows: ReplaceRow[]; fileErrors: string[]; fileWarnings: string[] } {
  const fileErrors: string[] = []
  const fileWarnings: string[] = []
  if (!table.length) return { rows: [], fileErrors: ['The sheet is empty.'], fileWarnings }

  const { map } = readHeaders(table[0])
  if (!map.includes('photo_1') || !(map.includes('slug') || map.includes('title'))) {
    fileErrors.push(
      'The sheet needs a photo_1 column, and a slug or title column to find each product. ' +
        'Use the template from the CMS so the headings match.',
    )
    return { rows: [], fileErrors, fileWarnings }
  }

  const findFile = fileFinder(ctx)
  const picked = new Set(ctx.files)
  const seen = new Map<string, number>()
  const rows: ReplaceRow[] = []

  table.slice(1).forEach((cells, i) => {
    const line = i + 2
    if (cells.every(blank)) return

    const cell: Record<string, unknown> = {}
    map.forEach((col, j) => {
      if (col) cell[col] = cells[j]
    })

    const errors: string[] = []
    const warnings: string[] = []

    const title = str(cell.title)
    const slug = slugify(str(cell.slug) || title)
    const existingId = slug ? ctx.existing.get(slug) : undefined
    if (!slug) errors.push('No slug or product name, so the product cannot be found.')
    else if (existingId === undefined) {
      errors.push(`No product at /product/${slug} in the shop. Use Bulk upload to add new products.`)
    }
    if (slug && seen.has(slug)) errors.push(`Same product as row ${seen.get(slug)}.`)
    else if (slug) seen.set(slug, line)

    const { photos, thumbnail } = rowImages(cell, findFile, errors, warnings)
    if (!photos.length && !errors.length) errors.push('No photos listed. A product cannot be left without photos.')

    const fresh = [...new Set([...photos, ...(thumbnail ? [thumbnail] : [])].filter((f) => picked.has(f)))]
    if (photos.length && !fresh.length) errors.push('None of this row’s images were picked, so there is nothing to replace.')

    rows.push({ line, title: title || slug, slug, photos, thumbnail, fresh, existingId, errors, warnings })
  })

  if (!rows.length && !fileErrors.length) fileErrors.push('The sheet has headings but no products.')
  return { rows, fileErrors, fileWarnings }
}

/** Every image a set of rows will need uploaded, each once. */
export function imagesNeeded(rows: CheckedRow[], inLibrary: (name: string) => boolean): string[] {
  const need = new Set<string>()
  for (const r of rows) {
    for (const f of [...r.photos, ...(r.thumbnail ? [r.thumbnail] : [])]) {
      if (!inLibrary(f)) need.add(f)
    }
  }
  return [...need]
}

/**
 * A filename with Payload's clash suffix taken off, for matching a picked
 * image to its earlier upload. Payload saves a second `diya-01.jpg` as
 * `diya-2.jpg` (it bumps the trailing number), so both fold to `diya.jpg`.
 */
export const stemOf = (name: string): string =>
  name.toLowerCase().replace(/(-\d+)?(\.[^.]*)?$/, (_, _n, ext = '') => ext)

/** The document body Payload expects for one row. */
export function productData(row: CheckedRow, ids: Map<string, number | string>) {
  const photos = row.photos.map((f) => ids.get(f)).filter((v) => v !== undefined)
  return {
    title: row.title,
    slug: row.slug,
    photos,
    thumbnail: row.thumbnail ? (ids.get(row.thumbnail) ?? null) : null,
    price: row.price,
    mrp: row.mrp,
    stock: row.stock,
    category: row.category,
    occasions: row.occasions,
    status: row.status,
    featured: row.featured,
    monthYearOfImport: row.monthYearOfImport || undefined,
    ...row.text,
  }
}
