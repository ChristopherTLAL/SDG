const { violet } = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          ...violet,
          DEFAULT: '#7c3aed',
          300: violet[300], // Added lighter shade
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
  variants: {
    extend: {
      textColor: ['group-hover'],
    }
  }
}