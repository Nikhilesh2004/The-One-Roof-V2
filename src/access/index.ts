import type { Access } from 'payload'

/** The storefront is public. Anyone may read the catalogue. */
export const publicRead: Access = () => true

/**
 * The shop has exactly one account, so "signed in" is the whole of the
 * permission model. There are no customer logins and no second staff
 * account to hold at arm's length.
 */
export const editorsOnly: Access = ({ req }) => Boolean(req.user)

/** Nobody registers. The one account is created by `npm run create-admin`. */
export const never: Access = () => false

/** The account may read and edit only itself. */
export const selfOnly: Access = ({ req }) => {
  if (!req.user) return false
  return { id: { equals: req.user.id } }
}
