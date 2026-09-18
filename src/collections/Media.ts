import type { CollectionConfig } from 'payload'

import { editorsOnly, publicRead } from '../access'

/**
 * Product photography. Payload resizes on upload, so a 4MB photo straight
 * off a phone still reaches a customer on 4G as a ~40KB thumbnail.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: {
    group: 'Shop',
    description: 'Every photo used on the site. You can also add photos straight from a product.',
  },
  access: { read: publicRead, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  upload: {
    /*
     * Uploads are written to the server's own disk. In the container that
     * disk must be the mounted volume (MEDIA_DIR=/app/media, set in the
     * Dockerfile): the default sits inside the image, and every redeploy
     * would throw the shop's photography away.
     */
    staticDir: process.env.MEDIA_DIR || undefined,
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, height: 1000, position: 'centre' },
      { name: 'full', width: 1600, height: undefined },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Describe the photo',
      admin: {
        description:
          'One short line for anyone using a screen reader, e.g. "Brass Krishna idol with a flute". Falls back to the product name.',
      },
    },
  ],
}
