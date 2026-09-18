import type { Metadata } from 'next'
import React from 'react'

import { WhatsAppIcon } from '../../../components/Icons'
import { waLink } from '../../../lib/format'
import { getCategories, getSettings } from '../../../lib/payload'
import { QuoteForm } from '../../../components/QuoteForm'


export const metadata: Metadata = {
  title: 'Visit or call',
  description: 'The One Roof, Sri Nagar 5th Lane, Guntur. Open 7 days. Message us on WhatsApp.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()])
  const wa = waLink(settings.whatsappNumber, 'Hi The One Roof! I have a question.')

  return (
    <div className="mx-auto max-w-[820px] px-5 py-14">
      <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)]">Visit or call</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-2)]">
        The quickest way to reach us is WhatsApp — we answer within minutes during shop hours. There
        is no payment on this website: we confirm what you want, tell you the total, and you pay at
        the shop or on delivery.
      </p>

      <div className="mt-10">
        <QuoteForm
          whatsappNumber={settings.whatsappNumber}
          sections={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <dl className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
        <Cell label="WhatsApp">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brass)] hover:underline"
          >
            {settings.displayPhone}
          </a>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Replies in minutes, {settings.hours}
          </p>
        </Cell>

        <Cell label="Email">
          <a href={`mailto:${settings.email}`} className="hover:text-[var(--brass)]">
            {settings.email}
          </a>
          <p className="mt-1 text-[12px] text-[var(--muted)]">Answered within 24 hours</p>
        </Cell>

        <Cell label="The shop">
          <p className="whitespace-pre-line">{settings.address}</p>
          {settings.mapsUrl && (
            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[12px] text-[var(--brass)] hover:underline"
            >
              Open in Google Maps →
            </a>
          )}
        </Cell>

        <Cell label="Hours">
          <p>{settings.hours}</p>
        </Cell>
      </dl>

      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-wa mt-10">
        <WhatsAppIcon />
        Message the shop
      </a>

      {settings.faqs && settings.faqs.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl">Questions</h2>
          <div className="mt-6 border-t border-[var(--line)]">
            {settings.faqs.map((faq) => (
              <details key={faq.id} className="group border-b border-[var(--line)]">
                <summary className="flex cursor-pointer items-center gap-4 py-5 text-sm font-medium marker:content-none">
                  {faq.question}
                  <span className="ml-auto flex-none text-[var(--brass)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] p-6">
      <dt className="text-[10.5px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-2 text-[14px] leading-relaxed">{children}</dd>
    </div>
  )
}
