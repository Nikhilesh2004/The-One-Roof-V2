import React from 'react'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5 21 21" />
  </svg>
)

export const BagIcon = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M4 7h16l-1.2 13H5.2L4 7Z" />
    <path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" />
  </svg>
)

export const SunIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...base}
    strokeWidth={1.7}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M5.9 5.9 4.4 4.4M19.6 19.6l-1.5-1.5M18.1 5.9l1.5-1.5M4.4 19.6l1.5-1.5" />
  </svg>
)

export const MoonIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...base}
    strokeWidth={1.7}
    aria-hidden="true"
  >
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
  </svg>
)

export const CloseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ArrowLeft = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)

export const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...base}
    strokeWidth={2.2}
    aria-hidden="true"
  >
    <path d="m4 12.5 5.2 5.2L20 7" />
  </svg>
)

export const MenuIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const WhatsAppIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.25.7-1.45 1.35-2 1.4-.53.05-1.02.24-3.44-.72-2.9-1.14-4.74-4.1-4.88-4.29-.14-.19-1.16-1.55-1.16-2.95s.73-2.1 1-2.38a1.03 1.03 0 0 1 .75-.35h.53c.17 0 .4-.06.63.48.24.58.8 2 .87 2.14.07.14.12.31.02.5-.1.2-.15.31-.3.48l-.44.51c-.14.14-.29.3-.12.59.16.28.73 1.2 1.56 1.95 1.07.95 1.97 1.25 2.25 1.4.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.19-.28.37-.23.63-.14.25.1 1.63.77 1.9.91.29.14.48.21.55.33.07.12.07.7-.18 1.4Z" />
  </svg>
)

export const YouTubeIcon = ({ size = 19 }: { size?: number }) => (
  <svg
    width={size}
    height={(size * 14) / 19}
    viewBox="0 0 24 17"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M23.5 3.5A3 3 0 0 0 21.4 1.4C19.6 1 12 1 12 1s-7.6 0-9.4.4A3 3 0 0 0 .5 3.5C0 5.3 0 8.5 0 8.5s0 3.2.5 5a3 3 0 0 0 2.1 2.1c1.8.4 9.4.4 9.4.4s7.6 0 9.4-.4a3 3 0 0 0 2.1-2.1c.5-1.8.5-5 .5-5s0-3.2-.5-5ZM9.6 12.1V4.9l6.3 3.6-6.3 3.6Z" />
  </svg>
)

export const RoofMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="tor-mark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E9CB7C" />
        <stop offset=".48" stopColor="#B98F31" />
        <stop offset="1" stopColor="#E9CB7C" />
      </linearGradient>
    </defs>
    <path
      d="M3.4 30A18.6 18.6 0 0 1 40.6 30"
      stroke="url(#tor-mark)"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <path
      d="M9.5 27.5 22 15.6l12.5 11.9"
      stroke="url(#tor-mark)"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <rect x="18.6" y="29.2" width="6.8" height="6.8" stroke="url(#tor-mark)" strokeWidth="1.5" />
    <path d="M22 29.2v6.8M18.6 32.6h6.8" stroke="url(#tor-mark)" strokeWidth="1" />
  </svg>
)
