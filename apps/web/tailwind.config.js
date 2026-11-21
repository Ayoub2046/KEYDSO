/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          500: '#1176BC',
          600: '#0f67a4',
          700: '#0c5284',
          900: '#0B2545',
        },
        palette: {
          blue: '#1176BC',
          cyan: '#25A8E0',
          lightGrey: '#ECECEC',
          softBlue: '#9FBBDE',
          silver: '#C6CACB',
          white: '#FFFFFF',
          navy: '#0B2545',
          navyDark: '#081C36',
        },
        navy: {
          800: '#11223c',
          900: '#0B2545',
          950: '#081C36',
        }
      }
    },
  },
  plugins: [],
}
