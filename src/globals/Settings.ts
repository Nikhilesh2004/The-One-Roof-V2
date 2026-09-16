import type { GlobalConfig } from 'payload'

import { editorsOnly, publicRead } from '../access'

/**
 * Everything about the shop itself — the number people message, the
 * address, the hours, the words on the home page. All of it editable,
 * so nobody has to open a code file to change a phone number.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Shop settings',
  admin: {
    group: 'Shop',
    description: 'The phone number, address, hours and the words on the home page.',
  },
  access: { read: publicRead, update: editorsOnly },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            {
              name: 'whatsappNumber',
              type: 'text',
              required: true,
              defaultValue: '919666662472',
              label: 'WhatsApp number',
              admin: {
                description:
                  'Country code first, digits only, no plus and no spaces. India is 91, so: 919666662472.',
              },
            },
            {
              name: 'displayPhone',
              type: 'text',
              defaultValue: '+91 96666 62472',
              label: 'Phone number as shown',
              admin: { description: 'How it appears on the page. Spaces are fine here.' },
            },
            { name: 'email', type: 'email', defaultValue: 'theoneroof4@gmail.com' },
            {
              name: 'address',
              type: 'textarea',
              defaultValue: 'Sri Nagar 5th Lane, Guntur, Andhra Pradesh',
              label: 'Shop address',
            },
            {
              name: 'hours',
              type: 'text',
              defaultValue: 'Open 7 days · 10 AM – 8 PM',
              label: 'Opening hours',
            },
            {
              name: 'mapsUrl',
              type: 'text',
              label: 'Google Maps link',
              admin: { description: 'Optional. Paste the share link from Google Maps.' },
            },
            /*
             * The two declarations Indian e-commerce rules ask a seller to
             * publish, kept in the CMS rather than the code because they are
             * facts about the business that only the shop can confirm.
             */
            {
              name: 'gstin',
              type: 'text',
              label: 'GSTIN',
              admin: { description: 'Shown in the strip under the header. Leave blank to hide it.' },
            },
            {
              name: 'grievance',
              type: 'group',
              label: 'Grievance officer',
              admin: {
                description:
                  'Required of every Indian e-commerce seller by the Consumer Protection (E-Commerce) Rules, 2020. Appears in the footer.',
              },
              fields: [
                { name: 'name', type: 'text', label: 'Name' },
                { name: 'email', type: 'email', label: 'Email' },
                { name: 'phone', type: 'text', label: 'Phone' },
                {
                  name: 'note',
                  type: 'textarea',
                  label: 'How complaints are handled',
                  admin: { description: 'e.g. acknowledged within 48 hours, resolved within a month.' },
                },
              ],
            },
            {
              name: 'youtubeHandle',
              type: 'text',
              defaultValue: '@TheOneRoof-y2g',
              label: 'YouTube handle',
            },
            { name: 'instagramUrl', type: 'text', label: 'Instagram link' },
          ],
        },
        {
          label: 'Who built it',
          description: 'The credit line at the very bottom of every page.',
          fields: [
            {
              name: 'agencyCredit',
              type: 'text',
              defaultValue: 'Made by',
              label: 'First credit line — wording',
              admin: { description: 'e.g. "Made by", "Designed by".' },
            },
            {
              name: 'agencyName',
              type: 'text',
              defaultValue: 'AALITECH',
              label: 'First credit line — who',
            },
            {
              name: 'maintainerCredit',
              type: 'text',
              defaultValue: 'Maintained by',
              label: 'Second credit line — wording',
              admin: {
                description:
                  'Shown under the first, joined by an "&". Clear both this and the name below to show one credit line only.',
              },
            },
            {
              name: 'maintainerName',
              type: 'text',
              defaultValue: 'AALI CONSSULTANCY',
              label: 'Second credit line — who',
            },
            {
              name: 'maintainerUrl',
              type: 'text',
              label: 'Second credit line — link',
              admin: { description: 'Leave blank and the name shows as plain text.' },
            },
            {
              name: 'madeInIndia',
              type: 'checkbox',
              defaultValue: false,
              label: 'Show the Made in India badge',
              admin: {
                description:
                  'Off until the image file is in place at /public/made-in-india.png. The Government of India’s own "Make in India" lion is a protected mark and needs DPIIT permission — a plain "Made in India" badge does not.',
              },
            },
            {
              name: 'agencyUrl',
              type: 'text',
              defaultValue: 'https://aalitech.co',
              label: 'First credit line — link',
              admin: { description: 'Leave blank and the name shows as plain text.' },
            },
          ],
        },
        {
          label: 'Home page words',
          fields: [
            {
              name: 'announcement',
              type: 'text',
              defaultValue: 'Free delivery over ₹999',
              label: 'Strip across the very top',
              admin: { description: 'Leave blank to hide that strip entirely.' },
            },
            { name: 'heroEyebrow', type: 'text', defaultValue: 'Guntur’s finest gift store' },
            {
              name: 'heroHeadline',
              type: 'textarea',
              defaultValue: 'Everything from the Shorts, now under one roof.',
              label: 'Big headline',
            },
            {
              name: 'heroBody',
              type: 'textarea',
              defaultValue:
                'Jewellery, shoes, watches, bags, décor, gifting and lifestyle — from the shop on Sri Nagar 5th Lane. Tap any Short, land on the product.',
              label: 'Paragraph under the headline',
            },
            {
              name: 'subscriberCount',
              type: 'text',
              defaultValue: '69.6K',
              label: 'Subscriber count shown on the home page',
            },
            {
              name: 'shortsSpeed',
              type: 'number',
              defaultValue: 11,
              min: 3,
              max: 40,
              label: 'How fast the Shoppable Shorts row drifts',
              admin: {
                description:
                  'Pixels a second. 11 is a slow, readable drift. 18 was the old Midnight site. Anything past 25 is too fast to read a price off. Change it here and the site picks it up within a minute — no code needed.',
              },
            },
            {
              name: 'aboutText',
              type: 'textarea',
              label: 'The About paragraph',
              defaultValue:
                'The One Roof began as a single shop in Guntur and grew through Telugu-language Shorts: budget wall clocks, double bumper shoe offers, Krishnashtami specials. Orders arrived over WhatsApp, one chat thread at a time. This storefront is that same shop — same buyer, same prices, same Guntur address.',
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              name: 'deliveryFee',
              type: 'number',
              defaultValue: 59,
              min: 0,
              label: 'Delivery charge (₹)',
            },
            {
              name: 'freeDeliveryOver',
              type: 'number',
              defaultValue: 999,
              min: 0,
              label: 'Free delivery above (₹)',
              admin: { description: 'Set to 0 to make delivery free on everything.' },
            },
            {
              name: 'deliveryNote',
              type: 'textarea',
              defaultValue:
                'We confirm availability, the final total and delivery on WhatsApp. Pay at the shop or on delivery — nothing is charged on this website.',
              label: 'The line under the enquiry button',
            },
          ],
        },
        {
          label: 'Questions',
          fields: [
            {
              name: 'faqs',
              type: 'array',
              label: 'Frequently asked questions',
              admin: { description: 'Shown on the home page and the contact page.' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
