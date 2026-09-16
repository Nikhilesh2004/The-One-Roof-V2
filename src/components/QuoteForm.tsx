'use client'

import React, { useState } from 'react'

import { WhatsAppIcon } from './Icons'

/**
 * Get a quote — for the bulk, wedding and festival orders that do not fit
 * the bag.
 *
 * Nothing is submitted anywhere and nothing is stored. The form composes a
 * message and opens WhatsApp with it, which is the only channel this shop
 * takes orders on: no server to hold a customer's phone number, nothing to
 * leak, and the enquiry lands in the same thread as every other one.
 */
export function QuoteForm({
  whatsappNumber,
  sections,
}: {
  whatsappNumber: string
  sections: { id: number | string; name: string }[]
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [section, setSection] = useState('')
  const [message, setMessage] = useState('')

  const ready = name.trim().length > 0

  const send = () => {
    if (!ready) return
    const lines = [
      'Hi The One Roof! I would like a quote.',
      '',
      `Name: ${name.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : '',
      section ? `Interested in: ${section}` : '',
      message.trim() ? `\n${message.trim()}` : '',
    ].filter(Boolean)

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const field =
    'mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[13.5px] text-[var(--ink)] outline-none focus:border-[var(--brass)]'
  const label = 'text-[10.5px] tracking-[0.16em] text-[var(--muted)] uppercase'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6"
    >
      <h2 className="font-display text-xl">Get a quote</h2>
      <p className="mt-1 text-[12.5px] text-[var(--muted)]">Bulk, wedding and festival orders</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className={label} htmlFor="q-name">
            Your name *
          </label>
          <input
            id="q-name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
          />
        </div>

        <div>
          <label className={label} htmlFor="q-phone">
            Phone / WhatsApp
          </label>
          <input
            id="q-phone"
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91"
            inputMode="tel"
          />
        </div>

        <div>
          <label className={label} htmlFor="q-section">
            I&rsquo;m interested in
          </label>
          <select
            id="q-section"
            className={field}
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">— Select a section —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="q-message">
            Your message
          </label>
          <textarea
            id="q-message"
            className={field}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you are looking for — quantity, occasion, budget."
          />
        </div>
      </div>

      <button type="submit" className="btn btn-wa mt-6 w-full" disabled={!ready}>
        <WhatsAppIcon />
        Send enquiry via WhatsApp
      </button>

      <p className="mt-3 text-[11.5px] text-[var(--muted)]">
        Opens WhatsApp with your details filled in. Nothing is stored on this page.
      </p>
    </form>
  )
}
