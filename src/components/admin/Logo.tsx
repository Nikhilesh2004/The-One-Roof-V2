import React from 'react'

/**
 * The shop's own board on the sign-in screen, cropped to the WHOLESALE &
 * RETAIL badge. The phone numbers and address are deliberately not in it —
 * they change, and an image is the worst place to keep something that does.
 *
 * A plain <img>: this renders inside Payload's admin, which is outside the
 * storefront's next/image pipeline.
 */
export function Logo() {
  return (
    <picture>
      <source srcSet="/logo-admin.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-admin.png"
        alt="The One Roof — wholesale & retail, Guntur"
        width={420}
        height={191}
        style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }}
      />
    </picture>
  )
}

export default Logo
