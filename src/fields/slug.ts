import type { Field, FieldHook } from 'payload'

const COMBINING_MARKS = /[̀-ͯ]/g

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Fills the slug from another field the first time, then leaves it alone.
 * A live product's URL must not change because someone fixed a typo in
 * the name — that would break every link already shared on WhatsApp.
 */
const fillFrom =
  (source: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    if (operation === 'create' || operation === 'update') {
      const from = data?.[source]
      if (typeof from === 'string' && from.length > 0) return slugify(from)
    }
    return value
  }

export const slugField = (source = 'title'): Field[] => [
  {
    name: 'slug',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description:
        'The web address of this page. Filled in automatically. Changing it breaks links already shared.',
    },
    hooks: { beforeValidate: [fillFrom(source)] },
  },
]
