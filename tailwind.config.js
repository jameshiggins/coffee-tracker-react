/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source + the entry HTML so JIT picks up every class we use.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: '#faf6f2',
          100: '#f1e8de',
          200: '#e0cdb8',
          300: '#cbac8a',
          400: '#b48a5f',
          500: '#9d6f44',
          600: '#85593a',
          700: '#6f4732',
          800: '#5a3a2a',
          900: '#4a3024',
        },
      },
    },
  },
  plugins: [],
};
