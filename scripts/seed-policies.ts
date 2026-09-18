/**
 * Drafts the five policy pages.
 *
 *   npm run seed:policies
 *
 * These are drafts, not legal advice. They are written to describe how
 * this shop actually works — no online payment, orders confirmed on
 * WhatsApp, goods paid for at the counter or on delivery — because a
 * policy copied from a site that takes card payments would describe a
 * business that does not exist here, and that is worse than nothing.
 *
 * Every place needing a fact only the shop has is marked [TO FILL].
 * Each page carries a visible "draft" notice until `needsReview` is
 * unticked in the admin.
 *
 * Safe to re-run: pages are matched on slug and updated, never doubled.
 */
// Next.js loads .env on its own; a plain tsx script does not.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Draft = {
  slug: string
  title: string
  summary: string
  order: number
  sections: { heading: string; body: string }[]
}

const PAGES: Draft[] = [
  {
    slug: 'terms-of-service',
    title: 'Terms of service',
    order: 10,
    summary: 'What you can expect from us, and what we ask of you.',
    sections: [
      {
        heading: 'Who you are dealing with',
        body: `This website is operated by The One Roof, a retail shop at Sri Nagar 5th Lane, Guntur, Andhra Pradesh.

Legal entity name: [TO FILL]
GSTIN: [TO FILL]
Registered address: [TO FILL]`,
      },
      {
        heading: 'This website does not take payments',
        body: `There is no checkout here and no card, UPI or net-banking details are ever collected. You build a bag, send it to us on WhatsApp, and we reply confirming what is in stock and what the total comes to.

Payment happens at the shop counter or on delivery. If any page, message or person asks you to pay through a link claiming to be us, it is not us. Ask on our published WhatsApp number before paying anyone anything.`,
      },
      {
        heading: 'An order is made when we confirm it',
        body: `Adding something to the bag does not reserve it, and sending us the list is a request rather than a purchase. Stock counts shown here are kept current but the shop sells over the counter too, so the last piece can go while you are typing.

A sale exists once we have replied confirming availability and the total, and you have agreed to it.`,
      },
      {
        heading: 'Prices',
        body: `Prices are in Indian rupees and include all applicable taxes. The figure we confirm on WhatsApp is the figure you pay — delivery included where it applies.

We correct pricing mistakes when we find them. If something is listed at an obviously wrong price we will tell you before confirming, and you are free to walk away.`,
      },
      {
        heading: 'Photographs',
        body: `Product photographs are taken in our own shop. Colour varies between screens, and brass and one-gram gold in particular photograph warmer than they look in the hand. Where an item is handmade, no two are identical.

If the piece you receive is not what you expected, tell us — see the returns page.`,
      },
      {
        heading: 'Changes to these terms',
        body: `We may update this page. The date at the bottom is when it last changed.`,
      },
    ],
  },

  {
    slug: 'privacy-policy',
    title: 'Privacy policy',
    order: 20,
    summary: 'What little we collect, and what we do not.',
    sections: [
      {
        heading: 'The short version',
        body: `We do not ask you to make an account. We do not collect card or bank details, because this website takes no payments. Your shopping bag and your saved items are stored in your own browser and never reach us until you choose to send them.`,
      },
      {
        heading: 'What is stored on your device',
        body: `Your bag and your saved list live in your browser's local storage, on your phone or computer. They stay there until you clear your browser data. We cannot read them, and they are not sent anywhere.

Your choice of light or dark appearance is stored the same way.`,
      },
      {
        heading: 'What reaches us, and when',
        body: `Only what you send. Pressing "Order this bag on WhatsApp" opens WhatsApp with a message you can read and edit before sending. Once you send it, we have your WhatsApp number and whatever you wrote, in that chat.

If you then order, we keep what we need to fulfil and account for the sale: what you bought, the amount, and a delivery address if there is a delivery.`,
      },
      {
        heading: 'WhatsApp',
        body: `Conversations happen on WhatsApp, which is operated by Meta, not by us. Their handling of your data is governed by their own privacy policy. If you would rather not use WhatsApp, telephone or email us instead — both are on the contact page.`,
      },
      {
        heading: 'Who else sees anything',
        body: `Our website runs on a server we rent from Hostinger, located in India, and its content is stored on that same server. Your bag and your saved items are never sent to it, because those never leave your browser.

We do not sell or share customer information. We do not run advertising trackers on this site. [TO FILL: name any analytics or delivery partner you use.]`,
      },
      {
        heading: 'Asking us what we hold',
        body: `Message or email us and we will tell you what we have about you, correct it, or delete it, unless we are required to keep it for tax or accounting purposes.

Contact for privacy questions: [TO FILL: name, email, phone]`,
      },
    ],
  },

  {
    slug: 'returns-and-exchange',
    title: 'Returns & exchange',
    order: 30,
    summary: 'What we will take back, in what condition, and by when.',
    sections: [
      {
        heading: 'If something is damaged or wrong',
        body: `Tell us within [TO FILL: e.g. 48 hours] of receiving it, with a photograph. If we sent the wrong item, or it arrived damaged, we replace it or refund it in full, and we bear the cost of getting it back.

Please photograph the parcel before opening it where you can. It settles a courier damage claim quickly.`,
      },
      {
        heading: 'If you simply changed your mind',
        body: `[TO FILL: state whether you accept change-of-mind returns, within how many days, and whether it is a refund, an exchange or a credit.]

Where we do accept one, the item must be unused and in its original packaging with any tags still attached.`,
      },
      {
        heading: 'What cannot come back',
        body: `[TO FILL: confirm this list matches how the shop actually trades.]

Items made or engraved to order. Earrings and other pierced jewellery, for hygiene. Anything used, marked or missing its packaging. Sale items marked as final.`,
      },
      {
        heading: 'How to start one',
        body: `Message us on WhatsApp with your order, the item code from the product page, and a photograph. We will tell you whether to bring it to the shop or send it back.

Refunds, where they apply, are made by the same route the payment came in, within [TO FILL: number] working days of us receiving the item.`,
      },
      {
        heading: 'Buying at the counter',
        body: `The same terms apply whether you found the item here or in the shop. Bring the bill.`,
      },
    ],
  },

  {
    slug: 'consumer-protection-e-commerce-rules',
    title: 'Consumer Protection (E-Commerce) Rules, 2020',
    order: 40,
    summary: 'The seller and grievance details these rules require us to publish.',
    sections: [
      {
        heading: 'Why this page exists',
        body: `The Consumer Protection (E-Commerce) Rules, 2020 require anyone selling online in India to publish who they are and how to complain, and to name someone responsible for answering complaints within set times. This page is that disclosure.`,
      },
      {
        heading: 'Seller',
        body: `The One Roof sells its own goods. This is not a marketplace: there are no third-party sellers here, and every item is stocked and dispatched by us.

Legal name: [TO FILL]
Principal place of business: [TO FILL — full registered address]
GSTIN: [TO FILL]
Email: theoneroof4@gmail.com
Telephone: +91 96666 62472`,
      },
      {
        heading: 'Grievance officer',
        body: `Name: [TO FILL]
Designation: [TO FILL]
Email: [TO FILL]
Telephone: [TO FILL]

The rules require a complaint to be acknowledged within forty-eight hours and resolved within one month of receipt.`,
      },
      {
        heading: 'How to complain',
        body: `Write to the grievance officer above with your order details and what went wrong. If you would rather start on WhatsApp, do — but ask for it to be recorded as a formal complaint so the clock starts.

You may also raise a complaint through the National Consumer Helpline on 1915, or at consumerhelpline.gov.in.`,
      },
      {
        heading: 'Country of origin',
        body: `Every product page states its country of origin. Where a page does not, it is because we have not yet verified it from the item's own label, and we would rather leave it blank than guess. Ask us and we will check the piece in the shop.`,
      },
    ],
  },

  {
    slug: 'legal-metrology-declarations',
    title: 'Legal Metrology declarations',
    order: 50,
    summary: 'The label information the law requires with every packaged item.',
    sections: [
      {
        heading: 'What must be declared',
        body: `The Legal Metrology (Packaged Commodities) Rules, 2011 require certain information to be shown before you buy a packaged item: what it is, how much of it there is, who made or imported it, where it came from, when it was imported or packed, and the maximum retail price inclusive of all taxes.`,
      },
      {
        heading: 'Where to find it',
        body: `On every product page, under "Label details". It carries the generic name, net quantity, country of origin, manufacturer or importer, month and year, size, weight and material, as printed on the item's own label.

The price shown is the maximum retail price and includes all taxes.`,
      },
      {
        heading: 'Where a field is blank',
        body: `A blank field means we have not yet read that value off the item itself. We do not fill these in by assumption — a wrong country of origin is a false declaration, not a typo.

If you need a value that is missing, ask us and we will check the physical label before you buy.`,
      },
      {
        heading: 'If a declaration looks wrong',
        body: `Tell us. We would rather correct it than defend it, and a mistake here is ours to fix.

Contact: [TO FILL: name and email of whoever is responsible for listings]`,
      },
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const page of PAGES) {
    const existing = await payload.find({
      collection: 'policies',
      where: { slug: { equals: page.slug } },
      limit: 1,
      depth: 0,
    })

    const data = { ...page, needsReview: true }

    if (existing.docs[0]) {
      await payload.update({ collection: 'policies', id: existing.docs[0].id, data })
      console.log(`updated  ${page.title}`)
    } else {
      await payload.create({ collection: 'policies', data })
      console.log(`created  ${page.title}`)
    }
  }

  console.log(`\n${PAGES.length} policy pages written, all marked as needing a read.`)
  console.log('Search them for [TO FILL] — those are the facts only the shop has.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding policies failed:', err)
  process.exit(1)
})
