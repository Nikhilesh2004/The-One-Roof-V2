import type { Metadata } from 'next'
import { Bodoni_Moda, Jost } from 'next/font/google'
import React from 'react'

import './styles.css'

import { BagDrawer } from '../../components/BagDrawer'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { BagProvider } from '../../lib/bag'
import { getCategories, getPolicies, getProducts, getSettings } from '../../lib/payload'
import { WishlistProvider } from '../../lib/wishlist'
import { themeBootScript } from '../../components/ThemeToggle'
import { JsonLd } from '../../components/JsonLd'
import { SITE_KEYWORDS, SITE_URL, graph, localBusiness, organisation, website } from '../../lib/seo'
import { ChatHelp } from '../../components/ChatHelp'

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
})

/*
 * Every page under this layout renders on each visit rather than at build.
 *
 * This layout reads the sections and shop settings, so every page touches
 * the database. On the VPS the image is built in a container that cannot
 * reach Postgres — and on a fresh deploy the tables do not exist until
 * migrations run at container start — so a page that prerendered would fail
 * the build. Rendering per visit also means a change saved in the CMS is on
 * the site immediately, with no revalidate window to wait out and no
 * incremental-regeneration writes to pay for.
 *
 * The database is on the same machine, so each render's queries cost
 * milliseconds. If traffic ever makes that matter, cache at the proxy.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // The words someone in Guntur would actually type, in the order they
    // would type them, and all of them true of the shop.
    default: 'The One Roof — Gift Shop in Guntur | Wholesale & Retail',
    template: '%s · The One Roof',
  },
  description:
    'Gift articles, pooja items, brass idols, home décor, one-gram gold jewellery, handbags and shoes. Wholesale and retail on Sri Nagar 5th Lane, Guntur. Order on WhatsApp — no online payment.',
  keywords: SITE_KEYWORDS,
  applicationName: 'The One Roof',
  authors: [{ name: 'The One Roof, Guntur' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'The One Roof',
    url: SITE_URL,
    title: 'The One Roof — Gift Shop in Guntur | Wholesale & Retail',
    description:
      'Everything you need under the one roof. Gifts, pooja items, décor, jewellery, bags and shoes, on Sri Nagar 5th Lane, Guntur.',
    images: [{ url: '/logo.webp', width: 1100, height: 500, alt: 'The One Roof, Guntur' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The One Roof — Gift Shop in Guntur',
    description: 'Everything you need under the one roof. Wholesale & retail, Guntur.',
    images: ['/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: true, address: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, policies, products] = await Promise.all([
    getCategories(),
    getSettings(),
    getPolicies(),
    // Names and prices only, for the help chat to search. The catalogue is
    // small and this render is cached like the rest of the page.
    getProducts(),
  ])

  return (
    <html lang="en-IN" className={`${bodoni.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* The shop, its opening hours and its address — the part that
            matters for "gift shop in Guntur" and for Google Maps. */}
        <JsonLd data={graph(organisation(), website(settings), localBusiness(settings))} />
        <WishlistProvider>
          <BagProvider>
            <Header categories={categories} settings={settings} />
            <main className="flex-1">{children}</main>
            <Footer categories={categories} settings={settings} policies={policies} />
            <BagDrawer
              whatsappNumber={settings.whatsappNumber}
              deliveryFee={settings.deliveryFee ?? 0}
              freeDeliveryOver={settings.freeDeliveryOver ?? 0}
              deliveryNote={settings.deliveryNote ?? ''}
            />
            {/* Answers from the owner's own FAQs, then hands over to
                WhatsApp. Mounted last so it layers above the page but
                below the bag drawer. */}
            <ChatHelp
              whatsappNumber={settings.whatsappNumber}
              faqs={(settings.faqs ?? []).map((f) => ({
                question: f.question,
                answer: f.answer,
              }))}
              products={products.map((p) => ({
                title: p.title,
                slug: p.slug ?? '',
                price: p.price,
              }))}
              sections={categories.map((c) => ({
                name: c.name,
                slug: c.slug ?? '',
                kinds: (c.subCategories ?? []).map((k) => k.name).filter(Boolean),
              }))}
              shop={{
                hours: settings.hours,
                address: settings.address,
                phone: settings.displayPhone,
                email: settings.email,
                gstin: settings.gstin,
                freeDeliveryOver: settings.freeDeliveryOver,
                deliveryFee: settings.deliveryFee,
              }}
            />
          </BagProvider>
        </WishlistProvider>
      </body>
    </html>
  )
}
