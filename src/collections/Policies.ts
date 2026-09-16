import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'
import { editorsOnly, publicRead } from '../access'

/**
 * Terms, privacy, returns and the two statutory disclosure pages.
 *
 * Kept as editable content rather than hard-coded pages, because these are
 * the parts of a shop's website most likely to be wrong at first and to
 * need correcting once someone who knows the business reads them.
 *
 * Content is a list of headed sections rather than rich text: legal pages
 * are headings and paragraphs, and this way what the shop types is exactly
 * what a customer reads, with no formatting to go wrong.
 */
export const Policies: CollectionConfig = {
  slug: 'policies',
  labels: { singular: 'Policy page', plural: 'Policy pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'needsReview', 'updatedAt'],
    group: 'Shop',
    description:
      'Terms, privacy, returns and the compliance disclosures. Read these before the shop takes its first order.',
  },
  access: { read: publicRead, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField('title'),
    {
      name: 'summary',
      type: 'textarea',
      label: 'One-line summary',
      admin: { description: 'Shown under the heading and in search results.' },
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Sections',
      admin: { description: 'Each becomes a heading and its paragraphs.' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'body',
          type: 'textarea',
          required: true,
          admin: { description: 'Leave a blank line between paragraphs.' },
        },
      ],
    },
    {
      name: 'needsReview',
      type: 'checkbox',
      defaultValue: true,
      label: 'Still needs a proper read',
      admin: {
        position: 'sidebar',
        description:
          'On until someone who knows the business — ideally a lawyer — has read this page. While it is on, the page carries a visible notice.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers come first in the footer.' },
    },
  ],
}
