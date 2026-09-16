import type { CollectionConfig } from 'payload'

import { never, selfOnly } from '../access'

/**
 * The single shop account.
 *
 * There is no registration, no sign-up screen and no second account. The
 * one login is created once by `npm run create-admin` from the credentials
 * in .env, and after that /admin only ever shows a sign-in form. Customers
 * never have accounts at all — there is no checkout to protect.
 *
 * `create` and `delete` are refused through the API and the admin panel.
 * The setup script reaches past them deliberately, the way a database
 * migration does.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Shop account', plural: 'Shop account' },
  admin: {
    useAsTitle: 'email',
    // Nothing to browse — one account, reachable from the user menu.
    hidden: true,
  },
  auth: {
    // Failed sign-ins lock the account briefly rather than allowing an
    // unlimited guessing rate against the only door into the shop.
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
    /*
     * Payload's default is two hours, which is wrong for the way this shop
     * works: a phone signed in on the shop floor during a photo session
     * would be signed out halfway through, mid-upload.
     *
     * Sign-in is a stateless JWT held in a cookie, so the phone and the
     * laptop each hold their own and neither displaces the other — the
     * same account can be signed in on both at once, which is the point.
     * Thirty days keeps the phone usable across a shoot and beyond.
     */
    tokenExpiration: 30 * 24 * 60 * 60,
  },
  access: {
    read: selfOnly,
    update: selfOnly,
    create: never,
    delete: never,
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      admin: { description: 'Shown in the corner of the admin. Yours to set.' },
    },
  ],
}
