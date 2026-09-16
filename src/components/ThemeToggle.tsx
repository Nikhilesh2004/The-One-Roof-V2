'use client'

import React, { useEffect, useState } from 'react'

import { MoonIcon, SunIcon } from './Icons'

type Theme = 'dark' | 'light'
const KEY = 'tor.theme'

/**
 * Runs before paint, so a viewer who chose light never sees a dark flash.
 * Kept as a string because it has to be inlined into the document head.
 */
export const themeBootScript = `
try {
  var t = localStorage.getItem('${KEY}');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`.trim()

const systemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = document.documentElement.getAttribute('data-theme') as Theme | null
    setTheme(stored ?? systemTheme())
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* the choice just will not survive a reload */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden h-10 w-10 place-items-center rounded-full sm:grid text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      aria-label={
        mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Switch theme'
      }
      title="Switch theme"
    >
      {mounted && theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
