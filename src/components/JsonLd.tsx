import React from 'react'

/**
 * One structured-data block per page.
 *
 * Rendered as a script tag rather than injected on the client, because a
 * crawler that does not run JavaScript still has to see it — which is the
 * entire point of putting it there.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
