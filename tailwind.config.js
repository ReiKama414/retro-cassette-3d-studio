/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Iansui', '"Microsoft JhengHei UI"', 'sans-serif'],
        mono: ['"Cascadia Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
      colors: {
        sakura: {
          50: '#fff0f6',
          100: '#ffdeeb',
          200: '#fcc2d7',
          300: '#faa2c1',
          400: '#f783ac',
          500: '#f06595',
          600: '#e64980',
          700: '#d6336c',
        }
      }
    },
  },
  plugins: [],
};
