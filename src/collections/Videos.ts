import path from 'path'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { editorsOnly, publicRead } from '../access'

/** Big enough for 30 seconds of 1080p phone video, small enough to catch a mistake. */
export const MAX_VIDEO_MB = 50

/**
 * Product videos. One per product, shown second in the product gallery,
 * after photo 1 — the Amazon order.
 *
 * Its own collection rather than a kind of photo: Payload makes resized
 * copies of every photo, which means nothing for a video, and the Photos
 * list stays photos.
 *
 * Files go in a folder inside the same volume as the photos (MEDIA_DIR,
 * set in the Dockerfile), so a redeploy keeps them. The files are served
 * with byte ranges, which iPhones need to play video at all.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    group: 'Shop',
    description: `Product videos. MP4, vertical (9:16), 15–30 seconds, under ${MAX_VIDEO_MB} MB.`,
  },
  access: { read: publicRead, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  upload: {
    staticDir: process.env.MEDIA_DIR ? path.join(process.env.MEDIA_DIR, 'videos') : undefined,
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  hooks: {
    beforeValidate: [
      ({ req }) => {
        const size = req.file?.size ?? 0
        if (size > MAX_VIDEO_MB * 1024 * 1024) {
          throw new APIError(
            `This video is ${(size / 1024 / 1024).toFixed(0)} MB. The limit is ${MAX_VIDEO_MB} MB — export it at 1080p or lower.`,
            400,
            undefined,
            true,
          )
        }
      },
    ],
  },
  fields: [],
}
