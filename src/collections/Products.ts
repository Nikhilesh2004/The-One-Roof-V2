import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'
import { editorsOnly, publicRead } from '../access'

export const OCCASIONS = [
  { label: 'Birthdays & celebrations', value: 'birthday' },
  { label: 'Weddings & housewarmings', value: 'wedding' },
  { label: 'Festivals & traditions', value: 'festival' },
  { label: 'Everyday & self', value: 'everyday' },
] as const

/**
 * Where a product is in its life.
 *
 * The shoot and the writing happen at different times and often on
 * different days: someone photographs twenty things in an hour, and the
 * descriptions get written that evening. A product therefore has to be
 * able to exist, hold its photos and its price, and stay off the website
 * until somebody says otherwise.
 */
export const PRODUCT_STATUSES = [
  {
    label: 'Draft — not on the website',
    value: 'draft',
  },
  {
    label: 'Live — customers can see and order it',
    value: 'live',
  },
  {
    label: 'Hidden — was live, taken down, kept on file',
    value: 'hidden',
  },
] as const

/** What a product still needs before it can go live. */
export function missingForLive(data: {
  photos?: unknown
  price?: number | null
  category?: unknown
  title?: string | null
}): string[] {
  const missing: string[] = []
  if (!data.title) missing.push('a name')
  if (!Array.isArray(data.photos) || data.photos.length === 0) missing.push('at least one photo')
  if (!data.price || data.price <= 0) missing.push('a selling price')
  if (!data.category) missing.push('a section')
  return missing
}

/**
 * The catalogue. Everything the shop sells lives here, and every field an
 * owner touches day to day — photos, stock, price, name — sits in the first
 * tab. The legal declarations sit in the second, out of the way but never
 * optional: country of origin and manufacturer are required of any Indian
 * e-commerce listing under the Legal Metrology (Packaged Commodities)
 * Rules, 2011 and the Consumer Protection (E-Commerce) Rules, 2020.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['photos', 'title', 'actions', 'status', 'category', 'price', 'stock'],
    group: 'Shop',
    description: 'Everything the shop sells. Click a product to change its photos, price or stock.',
    listSearchableFields: ['title', 'slug', 'description'],
  },
  access: { read: publicRead, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  defaultSort: 'title',
  fields: [
    // View / Edit / Delete on every row of the list. A column only — it
    // stores nothing and shows nothing on the product's own page.
    {
      name: 'actions',
      type: 'ui',
      label: 'Actions',
      admin: { components: { Cell: '/components/admin/RowActions#RowActions' } },
    },
    {
      type: 'tabs',
      tabs: [
        // ── Everything the shop changes week to week ──────────────────
        {
          label: 'The basics',
          description: 'Name it, photograph it, price it, count it. That is the whole job.',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Product name',
              admin: {
                description: 'What a customer sees, e.g. "Engraved Brass Kalash — Size 2".',
              },
            },
            {
              name: 'photos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Photos',
              admin: {
                description:
                  'Drag photos in. The first is the main picture — drag to reorder. Needed before this can go live, not before it can be saved.',
                components: {
                  // Draw the photos in the list instead of their filenames.
                  Cell: '/components/admin/PhotosCell#PhotosCell',
                },
              },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              label: 'Grid picture',
              admin: {
                description:
                  'Optional. The one picture shown in the shop grid, before a customer clicks in. Leave empty to use the first photo.',
              },
            },
            {
              name: 'video',
              type: 'upload',
              relationTo: 'videos',
              label: 'Video',
              admin: {
                description:
                  'Optional. Shown second on the product page, right after the first photo, and plays by itself (silent). MP4, vertical 9:16, 15–30 seconds.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  label: 'Selling price (₹)',
                  admin: {
                    width: '33%',
                    description: 'What the customer pays. Needed before it goes live.',
                  },
                },
                {
                  name: 'mrp',
                  type: 'number',
                  min: 0,
                  label: 'MRP (₹)',
                  admin: {
                    width: '33%',
                    description:
                      'Leave blank if there is no discount. Must not be below the selling price.',
                  },
                },
                {
                  name: 'stock',
                  type: 'number',
                  required: true,
                  min: 0,
                  defaultValue: 0,
                  label: 'How many are left',
                  admin: {
                    width: '34%',
                    description:
                      'Set to 0 and the product shows as sold out. It stays on the site.',
                  },
                },
              ],
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Section',
              admin: { description: 'Which part of the shop this belongs to.' },
            },
            {
              name: 'subCategory',
              type: 'text',
              label: 'Category',
              admin: {
                description: 'The kind of thing, within the section above.',
                // Typing this by hand meant "Wall clock" and "Wall Clocks"
                // became two silently different groups. The list comes from
                // the chosen section, exactly as it did in v1.
                components: { Field: '/components/admin/CategorySelect#CategorySelect' },
              },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
              admin: {
                description:
                  'A few honest sentences. What it is, what it is made of, who it suits.',
              },
            },
            {
              name: 'occasions',
              type: 'select',
              hasMany: true,
              options: [...OCCASIONS],
              label: 'Good for',
              admin: {
                description: 'Lets customers filter by the occasion they are shopping for.',
              },
            },
          ],
        },

        // ── The declarations the law asks for ─────────────────────────
        {
          label: 'Label details',
          description:
            'Copy these from the tag or box. Indian e-commerce rules require the country of origin and the manufacturer on every listing.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'countryOfOrigin',
                  type: 'text',
                  label: 'Country of origin',
                  admin: {
                    width: '50%',
                    description:
                      'Read it off the tag. Do not guess — a wrong declaration is a legal problem.',
                  },
                },
                {
                  name: 'manufacturer',
                  type: 'text',
                  label: 'Manufacturer / importer',
                  admin: { width: '50%', description: 'Name and address as printed on the label.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'genericName',
                  type: 'text',
                  label: 'Generic name',
                  admin: {
                    width: '50%',
                    description: 'What the thing is, plainly: "Brass idol", "Handbag".',
                  },
                },
                {
                  name: 'netQuantity',
                  type: 'text',
                  label: 'Net quantity',
                  admin: { width: '50%', description: 'e.g. "1 piece", "Set of 4".' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'dimensions', type: 'text', label: 'Size', admin: { width: '33%' } },
                { name: 'weight', type: 'text', label: 'Weight', admin: { width: '33%' } },
                {
                  name: 'finish',
                  type: 'text',
                  label: 'Material / finish',
                  admin: { width: '34%' },
                },
              ],
            },
            {
              name: 'monthYearOfImport',
              type: 'text',
              label: 'Month and year of import or manufacture',
              admin: { description: 'e.g. "March 2026". Required on imported goods.' },
            },
          ],
        },
      ],
    },

    // ── Sidebar: the switches ────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [...PRODUCT_STATUSES],
      label: 'On the website?',
      admin: {
        position: 'sidebar',
        description:
          'New products start as a draft. Photograph and price them now, write the description later, then set this to Live.',
      },
      validate: (value: unknown, { data }: { data: Record<string, unknown> }) => {
        if (value !== 'live') return true
        const missing = missingForLive(data)
        if (missing.length === 0) return true
        return `This cannot go live yet — it still needs ${missing.join(', ')}.`
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'First went live',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Filled in automatically the first time this is set to Live.',
      },
    },
    ...slugField('title'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show in Shoppable Shorts',
      admin: {
        position: 'sidebar',
        description:
          'Puts this product in the scrolling row on the home page. Four to eight products keeps that row moving nicely.',
      },
    },
    {
      name: 'shortCaption',
      type: 'text',
      label: 'Caption for the Shorts card',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.featured),
        description:
          'A few words over the photo, e.g. "Under ₹500". Falls back to the product name.',
      },
    },
    {
      name: 'shortSticker',
      type: 'text',
      label: 'Sticker',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.featured),
        description: 'The small badge in the corner, e.g. "New drop", "Bestseller". Optional.',
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data }) => {
        // An MRP below the selling price would render as a negative saving.
        if (data && typeof data.mrp === 'number' && typeof data.price === 'number') {
          if (data.mrp < data.price) data.mrp = data.price
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        // Stamp the first time it goes live, and never overwrite it — a
        // product taken down and put back is not a new product.
        if (data.status === 'live' && !originalDoc?.publishedAt && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
