'use client'

import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { CloseIcon } from './Icons'

/**
 * `url` is the 1600px `full` size, shown in the frame and full screen.
 * `thumbUrl` is the 400px `thumb`, for the strip of 64px buttons — without it
 * each button downloads a 1600px photo to paint a thumbnail, which the image
 * optimiser used to hide and no longer does.
 *
 * A `video` shot is the product video; `poster` is what shows before it
 * starts (photo 1).
 */
export type Shot = { url: string; thumbUrl?: string; alt: string; video?: boolean; poster?: string }

/**
 * The product video, playing the way Amazon's does: on its own the moment it
 * is shown, silent, looping, with controls to unmute or pause.
 *
 * Browsers only allow a video to start by itself when it is muted, and iPhones
 * only play it inside the page with playsInline. It is only mounted while its
 * slide is showing, so a visitor who never swipes to it never downloads it.
 */
function ProductVideo({ shot }: { shot: Shot }) {
  return (
    <video
      key={shot.url}
      src={shot.url}
      poster={shot.poster}
      aria-label={shot.alt}
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="auto"
      className="absolute inset-0 h-full w-full bg-black object-contain"
    />
  )
}

function PlayBadge() {
  return (
    <span className="absolute inset-0 grid place-items-center bg-black/25">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
      </span>
    </span>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

/**
 * The product gallery.
 *
 * Arrows either side on every device, swipe on touch, arrow keys when it
 * has focus, and a click or tap to see the photo full screen.
 */
export function Gallery({ shots }: { shots: Shot[] }) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const count = shots.length
  const go = useCallback((delta: number) => setActive((i) => (i + delta + count) % count), [count])

  // Arrow keys, once the gallery has focus.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    }
  }

  // Escape leaves the full-screen view.
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [zoomed, go])

  if (!count) {
    return (
      <div className="grid aspect-4/5 place-items-center bg-[var(--panel)] text-sm text-[var(--muted)]">
        No photo yet
      </div>
    )
  }

  const shot = shots[active]

  return (
    <>
      <div className="flex flex-col gap-3">
        <div
          ref={frame}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Product photos, ${active + 1} of ${count}`}
          onKeyDown={onKeyDown}
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current
            if (!start) return
            const dx = e.changedTouches[0].clientX - start.x
            const dy = e.changedTouches[0].clientY - start.y
            // Horizontal intent only, or a scroll down the page flips photos.
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? 1 : -1)
            touchStart.current = null
          }}
          // Clicking opens the photo full screen, on any device. There is
          // no magnify-under-the-cursor any more: it moved the picture
          // about while people were trying to look at it.
          // The video has its own controls; a click there must not open full screen.
          onClick={() => !shot.video && setZoomed(true)}
          className={`group relative aspect-4/5 overflow-hidden bg-[var(--panel)] ${shot.video ? '' : 'cursor-zoom-in'}`}
        >
          {shot.video ? (
            <ProductVideo shot={shot} />
          ) : (
            <Image
              key={shot.url}
              src={shot.url}
              alt={shot.alt}
              fill
              priority
              sizes="(min-width: 1024px) 560px, 92vw"
              className="object-cover"
            />
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Previous photo"
                className="absolute top-1/2 left-3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Next photo"
                className="absolute top-1/2 right-3 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
              >
                <Chevron dir="right" />
              </button>

              {/* At the top over the video, clear of its play and volume bar. */}
              <span className={`absolute ${shot.video ? 'top-3' : 'bottom-3'} left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white tabular-nums backdrop-blur-sm`}>
                {active + 1} / {count}
              </span>
            </>
          )}
        </div>

        {count > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Choose a photo">
            {shots.map((s, i) => (
              <button
                key={s.url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={s.video ? 'Play the video' : `Show photo ${i + 1} of ${count}`}
                aria-current={i === active}
                className={`relative h-20 w-16 flex-none overflow-hidden bg-[var(--panel)] transition-[box-shadow] ${
                  i === active
                    ? 'ring-2 ring-[var(--brass)]'
                    : 'ring-1 ring-[var(--line)] hover:ring-[var(--line-2)]'
                }`}
              >
                {s.video ? (
                  <>
                    {s.thumbUrl && <Image src={s.thumbUrl} alt="" fill sizes="64px" className="object-cover" />}
                    <PlayBadge />
                  </>
                ) : (
                  <Image src={s.thumbUrl || s.url} alt="" fill sizes="64px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        <p className="text-[11.5px] text-[var(--muted)]">
          Click a photo to see it full screen. Use the arrows to move between photos{shots.some((s) => s.video) ? ' and the video' : ''}.
        </p>
      </div>

      {/* ── Full-screen view, for touch ─────────────────────────────── */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${active + 1} of ${count}, enlarged`}
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close photo"
            className="absolute top-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
          >
            <CloseIcon size={22} />
          </button>

          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            }}
            onTouchEnd={(e) => {
              const start = touchStart.current
              if (!start) return
              const dx = e.changedTouches[0].clientX - start.x
              if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
              touchStart.current = null
            }}
          >
            {shot.video ? (
              <ProductVideo shot={shot} />
            ) : (
              <Image src={shot.url} alt={shot.alt} fill sizes="100vw" className="object-contain" />
            )}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Previous photo"
                className="absolute top-1/2 left-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Next photo"
                className="absolute top-1/2 right-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
              >
                <Chevron dir="right" />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs text-white tabular-nums">
                {active + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </>
  )
}
