'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { rupees } from '../lib/format'

export type ShortCard = {
  slug: string
  title: string
  caption: string
  sticker?: string
  price: number
  image: string | null
}

/**
 * The Shoppable Shorts rail.
 *
 * The track is repeated until it is comfortably wider than the screen, so
 * the loop is seamless at any product count, and the rail is scrolled back
 * by exactly half the track when it reaches the seam.
 *
 * It drifts by writing scrollLeft rather than by animating a transform.
 * The transform version looked the same and could not be swiped: the box
 * was `overflow: hidden`, so there was nothing for a finger to scroll and
 * dragging did nothing at all. As a scroll container it is swipeable for
 * free — native momentum on iOS, trackpad and wheel on a laptop, arrow keys
 * once focused — and the drift just steps aside while somebody is using it.
 *
 * It holds still on touch, wheel, hover and keyboard focus, stops while the
 * tab is hidden, and stays put entirely for anyone who asked for reduced
 * motion, who still gets a row they can swipe.
 */
/**
 * Default pixels a second, when the shop has not set its own.
 *
 * This is the Midnight pace, worked back from v1's CSS rather than from
 * the comment next to it. That rule was `animation: slide 46s` over a
 * -50% translate: eight cards at 198px plus a 16px gap is a ~1700px
 * track, so half of it in 46s is ~18px/s on a desktop and ~15px/s on a
 * phone, where the cards are narrower.
 *
 * v1's touch fallback claimed "~55px a second, as on desktop" in a
 * comment. That comment was wrong — nothing on desktop ever moved at
 * 55px/s — and taking it at face value made this rail run three times
 * too fast.
 */
const DEFAULT_SPEED = 11

export function ShortsRail({ items, speed }: { items: ShortCard[]; speed?: number | null }) {
  const SPEED = speed && speed > 0 ? speed : DEFAULT_SPEED

  const box = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(2)

  useEffect(() => {
    if (!items.length) return

    const measure = () => {
      const outer = box.current
      const inner = track.current
      if (!outer || !inner) return

      // Measure the TRACK, never the box: the box clips its overflow, so
      // its scrollWidth reports the visible width and every derived number
      // comes out wrong.
      const full = inner.getBoundingClientRect().width
      const one = full / copies
      if (one <= 0) return

      // The track slides left by half its width, so the right-hand half has
      // to be wide enough to keep the window full for the whole travel:
      // total >= 2 x viewport. Copies must stay even, or "half the track"
      // no longer lands on a seam between passes.
      const needed = Math.ceil((outer.clientWidth * 2) / one)
      const wanted = Math.max(2, needed + (needed % 2))
      if (wanted !== copies) {
        setCopies(wanted)
        return
      }

    }

    measure()
    // Both, because the box changes with the viewport and the track changes
    // as photos finish loading.
    const observer = new ResizeObserver(measure)
    if (box.current) observer.observe(box.current)
    if (track.current) observer.observe(track.current)
    return () => observer.disconnect()
  }, [items.length, copies, SPEED])

  /*
   * The drift, and the reason a swipe works at all.
   *
   * Moving scrollLeft rather than a transform means the rail is an ordinary
   * scroll container: a finger, a trackpad or a wheel just scrolls it, with
   * native momentum. All this loop has to do is nudge it along when nobody
   * is touching it, and put it back to the top of the loop at the seam.
   */
  useEffect(() => {
    const outer = box.current
    const inner = track.current
    if (!outer || !inner || !items.length) return

    const stillness = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let last = performance.now()
    let release = 0

    const held = () => Date.now() < release

    const step = (now: number) => {
      // A tab left in the background hands back a huge delta on return;
      // capped, or the rail leaps forward the moment you look at it.
      const dt = Math.min(64, now - last)
      last = now

      const half = inner.getBoundingClientRect().width / 2
      if (half > 0) {
        if (!held() && !document.hidden && !stillness.matches) {
          outer.scrollLeft += (SPEED * dt) / 1000
        }
        // Wrap only between gestures: doing it mid-swipe would cut the
        // momentum short under the finger.
        if (!held()) {
          if (outer.scrollLeft >= half) outer.scrollLeft -= half
          else if (outer.scrollLeft < 0.5) outer.scrollLeft += half
        }
      }
      frame = requestAnimationFrame(step)
    }

    // Anything that means "a person is using this" holds the drift off, and
    // it stays off briefly afterwards so momentum can finish.
    const hold = (ms: number) => () => {
      release = Math.max(release, Date.now() + ms)
    }
    const onDown = hold(1400)
    const onWheel = hold(1400)
    const onEnter = hold(600)

    outer.addEventListener('pointerdown', onDown)
    outer.addEventListener('touchstart', onDown, { passive: true })
    outer.addEventListener('touchmove', onDown, { passive: true })
    outer.addEventListener('wheel', onWheel, { passive: true })
    outer.addEventListener('mouseenter', onEnter)
    outer.addEventListener('mousemove', onEnter)
    outer.addEventListener('focusin', onDown)

    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      outer.removeEventListener('pointerdown', onDown)
      outer.removeEventListener('touchstart', onDown)
      outer.removeEventListener('touchmove', onDown)
      outer.removeEventListener('wheel', onWheel)
      outer.removeEventListener('mouseenter', onEnter)
      outer.removeEventListener('mousemove', onEnter)
      outer.removeEventListener('focusin', onDown)
    }
  }, [SPEED, items.length, copies])

  if (!items.length) return null

  return (
    <div
      ref={box}
      className="marquee no-scrollbar"
      // Announced as a region so a keyboard user can reach it; scrolling it
      // with arrow keys works because it is a real scroll container.
      tabIndex={0}
      role="group"
      aria-label="Shoppable Shorts"
    >
      <div className="marquee-track" ref={track}>
        {Array.from({ length: copies }).map((_, copy) =>
          items.map((item) => (
            <ShortTile
              key={`${copy}-${item.slug}`}
              item={item}
              // Only the first pass is real content; the rest are decoration
              // repeated for the loop, so screen readers skip them.
              ariaHidden={copy > 0}
            />
          )),
        )}
      </div>
    </div>
  )
}

function ShortTile({ item, ariaHidden }: { item: ShortCard; ariaHidden: boolean }) {
  return (
    <Link
      href={`/product/${item.slug}`}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className="group relative aspect-9/16 w-[clamp(146px,42vw,198px)] flex-none overflow-hidden rounded-[var(--radius-card)] bg-[var(--panel)] ring-1 ring-[var(--line)] transition-transform duration-500 ease-[var(--ease-silk)] hover:-translate-y-1.5"
    >
      {item.image ? (
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="200px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <span className="grid h-full place-items-center text-xs text-[var(--muted)]">No photo</span>
      )}

      {/* Half the card, not two thirds. The row exists so someone can see
          the product go past; a caption long enough to need a third of the
          frame is covering the only thing that matters. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/92 via-black/45 to-transparent"
      />

      <span className="absolute inset-x-2.5 bottom-2.5 block">
        {item.sticker && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-sm bg-[#F4F1EA]/95 px-2 py-0.5 text-[10px] font-semibold text-[#0B0D13]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hot)]" />
            {item.sticker}
          </span>
        )}
        {/* Two lines, then an ellipsis. "Engraved Brass Kalash — Size 2"
            used to run to four lines on a phone and bury the photo. */}
        <span
          className="line-clamp-2 block text-[11px] leading-tight text-[#F4F1EA]"
          title={item.caption}
        >
          {item.caption}
        </span>
        <span className="mt-0.5 block font-display text-[13px] text-[#F4F1EA]">
          {rupees(item.price)}
        </span>
      </span>
    </Link>
  )
}
