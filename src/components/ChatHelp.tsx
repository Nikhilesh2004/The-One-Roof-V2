'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { WhatsAppIcon } from './Icons'
import {
  answer,
  type ChatFaq,
  type ChatProduct,
  type ChatSection,
  type ChatShop,
} from '../lib/chat-answers'

type Turn = {
  from: 'them' | 'shop'
  text: string
  products?: ChatProduct[]
  section?: ChatSection
  unsure?: boolean
}

/**
 * The shop's help chat.
 *
 * Type a question and it answers from the shop's own data — opening hours,
 * address, GSTIN, delivery, the owner's FAQs, and the real catalogue. It is
 * not a language model: prices and stock change on the shelf, the shop takes
 * no payments online, and a model guessing at either would eventually tell a
 * customer something untrue. When it does not know, it says so and hands the
 * question to WhatsApp rather than inventing an answer.
 *
 * Everything runs in the browser. No request leaves the page, nothing is
 * stored, and there is no third-party widget.
 */
export function ChatHelp({
  whatsappNumber,
  faqs,
  products,
  sections,
  shop,
}: {
  whatsappNumber: string
  faqs: ChatFaq[]
  products: ChatProduct[]
  sections: ChatSection[]
  shop: ChatShop
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>([
    {
      from: 'shop',
      text: 'Hello! Ask me anything — our timings, where we are, delivery, or whether we have something.',
    },
  ])

  const bubbleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        bubbleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Keep the newest reply in view without yanking the whole page around.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [turns, open])

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    const reply = answer(q, faqs, products, shop, sections)
    setTurns((t) => [...t, { from: 'them', text: q }, { from: 'shop', ...reply }])
    setDraft('')
  }

  const lastAsked = [...turns].reverse().find((t) => t.from === 'them')?.text
  const stuck = turns[turns.length - 1]?.unsure

  const waText = lastAsked
    ? 'Hi The One Roof! I asked this on the website: "' + lastAsked + '"'
    : 'Hi The One Roof! I have a question.'
  const wa = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(waText)

  // Openers, shown only while the conversation has not started.
  const starters = ['What time do you open?', 'Where is the shop?', 'Do you deliver?']

  return (
    <>
      {/*
        Above the mobile sticky buy bar (z-30, bottom of product pages) and
        below the bag drawer (z-50), so it never covers a price or traps
        anyone mid-checkout.
      */}
      <button
        ref={bubbleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="chat-help-panel"
        className="fixed right-4 bottom-24 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--brass)] text-black shadow-lg transition-transform hover:scale-105 lg:bottom-6"
      >
        <span className="sr-only">{open ? 'Close chat' : 'Chat with the shop'}</span>
        {open ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="chat-help-panel"
          role="dialog"
          aria-label="Chat with the shop"
          className="fixed right-4 bottom-40 z-30 flex max-h-[70vh] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl lg:bottom-22"
        >
          <div className="flex-none border-b border-[var(--line)] px-4 py-3">
            <p className="text-[13px] font-semibold">The One Roof</p>
            <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
              {shop.hours ? shop.hours : 'We reply on WhatsApp'}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {turns.map((t, i) => (
              <div key={i} className={t.from === 'them' ? 'flex justify-end' : ''}>
                <div
                  className={
                    t.from === 'them'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--brass)] px-3 py-2 text-[12.5px] text-black'
                      : 'max-w-[90%] rounded-2xl rounded-bl-sm bg-[var(--panel)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ink-2)]'
                  }
                >
                  {t.text}

                  {t.products && t.products.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {t.products.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={'/product/' + p.slug}
                            onClick={() => setOpen(false)}
                            className="block rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[12px] text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                          >
                            {p.title}
                            {typeof p.price === 'number' && p.price > 0 && (
                              <span className="text-[var(--muted)]">
                                {' · ₹' + p.price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {t.section && (
                    <Link
                      href={'/shop/' + t.section.slug}
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-block rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[12px] text-[var(--ink)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                    >
                      {'See ' + t.section.name + ' →'}
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {turns.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11.5px] text-[var(--muted)] hover:border-[var(--brass)] hover:text-[var(--brass)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="flex-none border-t border-[var(--line)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(draft)
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                // Enter sends, explicitly. Relying on the form's implicit
                // submission did not fire here, and in a chat box Enter not
                // working is the difference between usable and broken.
                // `isComposing` guards IME input, where Enter is committing
                // a word rather than sending the message.
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    ask(draft)
                  }
                }}
                placeholder="Type your question…"
                aria-label="Your question"
                className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2 text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--brass)]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--brass)] text-black disabled:opacity-40"
              >
                <span className="sr-only">Send</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>

            {/* Always reachable, and emphasised the moment we admit we do not know. */}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={
                stuck
                  ? 'btn btn-wa mt-2.5 w-full text-[12px]'
                  : 'mt-2.5 flex items-center justify-center gap-2 text-[11.5px] text-[var(--muted)] hover:text-[var(--brass)]'
              }
            >
              <WhatsAppIcon size={13} />
              {stuck ? 'Ask a person on WhatsApp' : 'Or talk to a person on WhatsApp'}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
