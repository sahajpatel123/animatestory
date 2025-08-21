import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fbff',
          100: '#e6f7ff',
          200: '#bfeeff',
          300: '#99e5ff',
          400: '#4dd2ff',
          500: '#00beff',
          600: '#00a9e6',
          700: '#0080b3',
          800: '#005780',
          900: '#003d59'
        }
      }
    },
  },
  plugins: [],
}

export default config


