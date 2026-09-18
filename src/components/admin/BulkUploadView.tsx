import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { BulkUpload } from './BulkUpload'

/**
 * /admin/bulk-upload, inside the CMS's own frame so the menu stays put.
 *
 * A custom view renders bare unless it is wrapped in DefaultTemplate; the
 * props passed through are exactly what the template needs to draw the nav
 * for this user. Editors only — the REST calls behind the page would refuse a
 * visitor anyway, but there is no point showing them the screen.
 */
export function BulkUploadView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fbulk-upload')

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <BulkUpload />
      </Gutter>
    </DefaultTemplate>
  )
}

export default BulkUploadView
