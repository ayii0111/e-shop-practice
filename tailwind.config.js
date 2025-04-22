/** @type {import('tailwindcss').Config} */
import twPrimeui from 'tailwindcss-primeui'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [twPrimeui],
}
