import React from 'react'

/** The small mark in the admin's top-left corner, once signed in. */
export function Icon() {
  return (
    <svg width="26" height="26" viewBox="0 0 44 44" fill="none" aria-label="The One Roof">
      <defs>
        <linearGradient id="tor-icon-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9CB7C" />
          <stop offset=".48" stopColor="#B98F31" />
          <stop offset="1" stopColor="#E9CB7C" />
        </linearGradient>
      </defs>
      <path
        d="M3.4 30A18.6 18.6 0 0 1 40.6 30"
        stroke="url(#tor-icon-mark)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 27.5 22 15.6l12.5 11.9"
        stroke="url(#tor-icon-mark)"
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x="18.6"
        y="29.2"
        width="6.8"
        height="6.8"
        stroke="url(#tor-icon-mark)"
        strokeWidth="1.7"
      />
    </svg>
  )
}

export default Icon
