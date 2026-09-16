/**
 * Works out what a typed question is asking and answers it from the shop's
 * own data.
 *
 * There is no model behind this on purpose. Prices and stock change on the
 * shelf, the shop takes no payments online, and a language model that
 * guessed at either would eventually tell a customer something untrue —
 * which for this shop means an argument at the counter, not a bad demo.
 * So every answer here is either a fact from Shop settings, an FAQ the
 * owner wrote, or a link to real products. When nothing scores well enough
 * it says so and offers WhatsApp rather than inventing something.
 */

export type ChatFaq = { question: string; answer: string }
export type ChatProduct = { title: string; slug: string; price?: number | null }
export type ChatSection = { name: string; slug: string; kinds: string[] }

export type ChatShop = {
  hours?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  gstin?: string | null
  freeDeliveryOver?: number | null
  deliveryFee?: number | null
}

export type ChatReply = {
  text: string
  /** Products worth showing as links under the answer. */
  products?: ChatProduct[]
  /** A section of the shop to send them to. */
  section?: ChatSection
  /** True when we did not really know — the UI leans on WhatsApp harder. */
  unsure?: boolean
}

/** Words that carry no signal when matching a short question. */
const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could',
  'will', 'would', 'shall', 'should', 'may', 'might', 'i', 'you', 'we', 'they', 'it',
  'me', 'my', 'your', 'our', 'to', 'of', 'in', 'on', 'at', 'for', 'from', 'by', 'with',
  // Note: the location word is absent by design — in 'where are you' every
  // other word is a stopword, so dropping it too left nothing to match on.
  'and', 'or', 'but', 'if', 'how', 'what', 'when', 'which', 'who', 'why',
  'there', 'have', 'has', 'had', 'get', 'got', 'any', 'some', 'this', 'that', 'please',
  'hi', 'hello', 'hey', 'thanks', 'thank', 'u', 'ur', 'pls', 'plz',
])

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9₹\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

/**
 * Words a shopper and a product label spell differently, folded together —
 * the labels here read "Eau De Parfum" while customers type "perfume".
 */
const ALIAS: Record<string, string> = {
  jewelry: 'jewellery',
  oudh: 'oud',
  parfum: 'perfume',
  parfume: 'perfume',
  perfumery: 'perfume',
  attar: 'perfume',
  scent: 'perfume',
  fragrance: 'perfume',
  chappal: 'footwear',
  sandal: 'footwear',
  murti: 'idol',
  statue: 'idol',
}

/**
 * Singular and plural folded together.
 *
 * A blunt `es$` rule looks fine until it splits the pair it was meant to
 * join: it turned "perfumes" into "perfum" while leaving "perfume" alone, so
 * the plural matched the shelf and the singular found nothing. Only strip
 * "es" after the letters that actually take it (watches, glasses, boxes).
 */
function stem(word: string): string {
  const w = ALIAS[word] ?? word
  if (w.length <= 3) return w
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y'
  if (/(ch|sh|s|x|z)es$/.test(w)) return w.slice(0, -2)
  if (/ss$/.test(w)) return w
  if (/s$/.test(w)) return w.slice(0, -1)
  return w
}

function overlap(a: string[], b: string[]): number {
  const B = new Set(b.map(stem))
  let hits = 0
  for (const w of new Set(a.map(stem))) if (B.has(w)) hits++
  return hits
}

/** Intents the shop can answer exactly, checked before the fuzzy FAQ match. */
const INTENTS: { keys: string[]; reply: (s: ChatShop) => string | null }[] = [
  {
    keys: ['hour', 'timing', 'open', 'close', 'closing', 'opening', 'sunday', 'today'],
    reply: (s) => (s.hours ? `We are ${s.hours.replace(/^Open /, 'open ')}.` : null),
  },
  {
    keys: ['where', 'address', 'location', 'shop', 'store', 'reach', 'direction', 'map', 'guntur'],
    reply: (s) =>
      s.address ? `We are at ${s.address.split('\n').map((l) => l.trim().replace(/,+$/, '')).filter(Boolean).join(', ')}.` : null,
  },
  {
    keys: ['gst', 'gstin', 'tax', 'invoice', 'bill'],
    reply: (s) => (s.gstin ? `Yes — we are GST registered. Our GSTIN is ${s.gstin}.` : null),
  },
  {
    keys: ['phone', 'number', 'call', 'contact', 'whatsapp', 'mobile'],
    reply: (s) =>
      s.phone ? `You can reach us on ${s.phone}${s.email ? `, or email ${s.email}` : ''}.` : null,
  },
  {
    keys: ['delivery', 'deliver', 'shipping', 'ship', 'courier', 'free'],
    reply: (s) => {
      if (typeof s.freeDeliveryOver === 'number' && s.freeDeliveryOver > 0) {
        const fee = typeof s.deliveryFee === 'number' && s.deliveryFee > 0 ? ` Below that it is ₹${s.deliveryFee}.` : ''
        return `Delivery is free on orders over ₹${s.freeDeliveryOver.toLocaleString('en-IN')}.${fee} Tell us where you are on WhatsApp and we will confirm.`
      }
      return null
    },
  },
  {
    keys: ['pay', 'payment', 'card', 'upi', 'online', 'cod', 'cash', 'checkout', 'buy'],
    reply: () =>
      'We take no payments on the website. You send the bag over WhatsApp, we confirm the total, and you pay at the shop or on delivery.',
  },
  {
    keys: ['wholesale', 'bulk', 'quantity', 'dozen', 'retailer', 'reseller'],
    reply: () =>
      'Yes, we do wholesale as well as retail. Send us the item and the quantity on WhatsApp and we will quote you.',
  },
]

export function answer(
  input: string,
  faqs: ChatFaq[],
  products: ChatProduct[],
  shop: ChatShop,
  sections: ChatSection[] = [],
): ChatReply {
  const q = tokens(input)
  if (q.length === 0) {
    return { text: 'Ask me about our timings, where we are, delivery, or anything in the shop.' }
  }

  // 1. Products first when the question names something we actually stock —
  //    "do you have brass idols" should show idols, not the returns policy.
  const matches = products
    .map((p) => ({ p, score: overlap(q, tokens(p.title)) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = matches[0]?.score ?? 0
  if (best >= 1 && matches.filter((m) => m.score === best).length <= 12) {
    const top = matches.filter((m) => m.score >= best).slice(0, 3).map((m) => m.p)
    if (top.length > 0) {
      return {
        text:
          top.length === 1
            ? 'Yes — we have this:'
            : `Yes — here ${top.length === 2 ? 'are two' : 'are a few'} we have:`,
        products: top,
      }
    }
  }

  // 2. A whole section of the shop — "do you sell watches", "perfumes?".
  //    Matched on the section name and on the kinds of thing inside it, so
  //    "perfumes" finds the shelf it lives on rather than nothing.
  const sectionHit = sections
    .map((sec) => ({
      sec,
      score: overlap(q, tokens(sec.name)) * 2 + overlap(q, tokens(sec.kinds.join(' '))),
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)[0]

  if (sectionHit) {
    return {
      text: `Yes — that is in our ${sectionHit.sec.name} section.`,
      section: sectionHit.sec,
    }
  }

  // 2. Facts the shop states about itself.
  for (const intent of INTENTS) {
    if (q.some((w) => intent.keys.includes(stem(w)))) {
      const text = intent.reply(shop)
      if (text) return { text }
    }
  }

  // 3. The owner's own FAQs, matched on the question and its answer.
  const faqScores = faqs
    .map((f) => ({ f, score: overlap(q, tokens(f.question)) * 2 + overlap(q, tokens(f.answer)) }))
    .sort((a, b) => b.score - a.score)

  if (faqScores[0] && faqScores[0].score >= 2) return { text: faqScores[0].f.answer }

  // 4. Say so, rather than guess.
  return {
    text: 'I am not sure about that one. Ask us on WhatsApp and a person will answer — usually within minutes during shop hours.',
    unsure: true,
  }
}
