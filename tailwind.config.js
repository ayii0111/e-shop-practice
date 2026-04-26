/** @type {import('tailwindcss').Config} */
import twPrimeui from 'tailwindcss-primeui'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // 擴展 24 列網格
        24: 'repeat(24, minmax(0, 1fr))',
      },

    },
  },
  plugins: [twPrimeui],
}
