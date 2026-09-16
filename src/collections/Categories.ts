import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'
import { editorsOnly, publicRead } from '../access'

/**
 * A section of the shop — Home & Decor, Bags, Jewellery and so on.
 * Products point at one of these, and the home page draws a tile per row.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  // The shop's own words, carried over from v1: a SECTION is the top level
  // (Home & Décor, Bags), a CATEGORY is the kind of thing inside it (Wall
  // Clocks, Handbags). Most CMSs use "category" for the top level; matching
  // the vocabulary the shop already has in its fingers matters more.
  labels: { singular: 'Section', plural: 'Sections' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'order'],
    group: 'Shop',
    description:
      'The sections of the shop. Every product belongs to one. Lower order numbers come first in the menu.',
  },
  access: { read: publicRead, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Shown as the section heading, e.g. "Home & Décor".' },
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
      admin: { description: 'The one word that fits in the top menu, e.g. "Decor".' },
    },
    ...slugField('name'),
    {
      name: 'blurb',
      type: 'textarea',
      admin: { description: 'One or two lines under the heading. Optional.' },
    },
    {
      name: 'subCategories',
      type: 'array',
      labels: { singular: 'Category', plural: 'Categories' },
      admin: {
        description:
          'The kinds of thing in this section — wall clocks, photo frames, idols. These become the Category dropdown on a product, and are listed on the section tile.',
      },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers come first in the menu.',
      },
    },
  ],
}
