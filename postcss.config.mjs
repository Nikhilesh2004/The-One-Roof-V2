/** Tailwind v4 runs as a PostCSS plugin. Payload's admin ships its own
 *  stylesheet and is scoped away from this by the (payload) route group. */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
