/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  prefix: 'cct-',
  corePlugins: {
    preflight: false,
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
