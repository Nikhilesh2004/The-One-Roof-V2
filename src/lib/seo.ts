import type { Category, Policy, Product, Setting } from '../payload-types'
import { imageUrl, mainPhoto } from './media'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://theoneroof.co'

const abs = (path: string) => new URL(path, SITE_URL).toString()

/**
 * Structured data.
 *
 * The One Roof is a physical shop on a named lane in Guntur that also
 * sells online. Almost all of its realistic search traffic is local and
 * intent-led — "gift shop in Guntur", "brass idols near me" — so the
 * schema that matters most is the one describing the shop itself, its
 * address and its opening hours, not the storefront software.
 *
 * Every builder returns a plain object. Pages serialise it into a single
 * <script type="application/ld+json"> so search engines get one graph per
 * page rather than a scattering of fragments.
 */

/** The shop as a place you can walk into. */
export function localBusiness(settings: Setting) {
  const [street, ...rest] = (settings.address ?? '').split('\n')

  return {
    '@type': 'Store',
    '@id': `${SITE_URL}/#shop`,
    name: 'The One Roof',
    description:
      'Gift articles, pooja items, home décor, one-gram gold jewellery, handbags and shoes. Wholesale and retail, in Guntur.',
    url: SITE_URL,
    telephone: settings.displayPhone ?? undefined,
    email: settings.email ?? undefined,
    image: abs('/logo.webp'),
    logo: abs('/logo.webp'),
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI on delivery, Card at the counter',
    address: {
      '@type': 'PostalAddress',
      streetAddress: street || 'Sri Nagar 5th Lane',
      addressLocality: 'Guntur',
      addressRegion: 'Andhra Pradesh',
      postalCode: rest.join(' ').match(/\b5\d{5}\b/)?.[0] ?? '522002',
      addressCountry: 'IN',
    },
    areaServed: [
      { '@type': 'City', name: 'Guntur' },
      { '@type': 'AdministrativeArea', name: 'Andhra Pradesh' },
    ],
    // "Open 7 days · 10 AM – 8 PM", said in the way a crawler reads it.
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '10:00',
        closes: '20:00',
      },
    ],
    sameAs: [
      settings.youtubeHandle ? `https://youtube.com/${settings.youtubeHandle}` : null,
      settings.instagramUrl || null,
    ].filter(Boolean),
  }
}

export function organisation() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organisation`,
    name: 'The One Roof',
    url: SITE_URL,
    logo: abs('/logo.webp'),
  }
}

export function website(settings: Setting) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'The One Roof',
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organisation` },
    // Lets Google offer a search box for the site in results.
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
    ...(settings.email ? {} : {}),
  }
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: abs(step.path),
    })),
  }
}

export function productSchema(product: Product, category: Category | null) {
  const price = product.price ?? 0
  const photos = (Array.isArray(product.photos) ? product.photos : [])
    .map((p) => imageUrl(p, 'full'))
    .filter((u): u is string => Boolean(u))

  return {
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    sku: 'TOR-' + (product.slug ?? '').toUpperCase().replace(/-/g, ''),
    image: photos.length ? photos : [imageUrl(mainPhoto(product), 'full')].filter(Boolean),
    category: category?.name ?? undefined,
    material: product.finish ?? undefined,
    countryOfOrigin: product.countryOfOrigin ?? undefined,
    brand: { '@type': 'Brand', name: 'The One Roof' },
    offers: {
      '@type': 'Offer',
      url: abs(`/product/${product.slug}`),
      price,
      priceCurrency: 'INR',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#shop` },
    },
  }
}

/** A category page is a list of products, and saying so earns rich results. */
export function itemList(products: Product[], listName: string) {
  return {
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 60).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`/product/${p.slug}`),
      name: p.title,
    })),
  }
}

export function faqSchema(faqs: NonNullable<Setting['faqs']>) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

/** Wraps everything a page wants to say into one graph. */
export function graph(...nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }
}

/* ── Words, not just markup ─────────────────────────────────────────────
   Search engines still read the title and the first paragraph. These are
   the phrases someone in Guntur actually types, kept honest: the shop
   really is wholesale and retail, really is on Sri Nagar 5th Lane, and
   really does sell each of these things. None of it is stuffing.
   ─────────────────────────────────────────────────────────────────── */

export const SITE_KEYWORDS = [
  'gift shop in Guntur',
  'wholesale gift articles Guntur',
  'pooja items Guntur',
  'brass idols Guntur',
  'home decor Guntur',
  'one gram gold jewellery Guntur',
  'handbags Guntur',
  'return gifts Guntur',
  'Sri Nagar 5th Lane Guntur',
]

/** A description for a section page, written from what is actually in it. */
export function categoryDescription(category: Category, count: number): string {
  const kinds = (category.subCategories ?? [])
    .map((s) => s.name)
    .filter(Boolean)
    .slice(0, 5)
    .join(', ')

  const opening = category.blurb?.trim()
    ? category.blurb.trim()
    : `${category.name} at The One Roof, Guntur.`

  return [
    opening,
    kinds ? `${kinds}.` : '',
    count > 0 ? `${count} in stock now.` : '',
    'Wholesale and retail on Sri Nagar 5th Lane. Order on WhatsApp.',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 300)
}
