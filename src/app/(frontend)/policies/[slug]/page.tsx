import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { getPolicies, getPolicyBySlug } from '../../../../lib/payload'


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const policy = await getPolicyBySlug(slug)
  if (!policy) return { title: 'Page not found' }

  return {
    title: policy.title,
    description: policy.summary ?? undefined,
    alternates: { canonical: `/policies/${policy.slug}` },
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [policy, all] = await Promise.all([getPolicyBySlug(slug), getPolicies()])
  if (!policy) notFound()

  return (
    <div className="mx-auto max-w-[760px] px-5 py-12">
      <nav aria-label="Breadcrumb" className="text-[11.5px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-[var(--ink-2)]">
          {policy.title}
        </span>
      </nav>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)]">{policy.title}</h1>
      {policy.summary && (
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{policy.summary}</p>
      )}

      {policy.needsReview && (
        <p className="mt-6 border-l-2 border-[var(--warn)] bg-[var(--warn)]/10 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
          <strong className="text-[var(--warn)]">Draft.</strong> This page has not yet been checked
          by the shop or by a lawyer. Anything on it may be wrong or incomplete — please ask us on
          WhatsApp rather than relying on it.
        </p>
      )}

      <div className="mt-10 space-y-9">
        {(policy.sections ?? []).map((section) => (
          <section key={section.id}>
            <h2 className="font-display text-xl">{section.heading}</h2>
            {section.body.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="mt-3 text-[14px] leading-relaxed text-[var(--ink-2)]">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-[var(--line)] pt-6 text-[12px] text-[var(--muted)]">
        Last updated{' '}
        {new Date(policy.updatedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        .
      </p>

      {all.length > 1 && (
        <nav aria-label="Other policies" className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
          {all
            .filter((p) => p.id !== policy.id)
            .map((p) => (
              <Link
                key={p.id}
                href={`/policies/${p.slug}`}
                className="text-[12.5px] text-[var(--brass)] hover:underline"
              >
                {p.title}
              </Link>
            ))}
        </nav>
      )}
    </div>
  )
}
