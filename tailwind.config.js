import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Anchor content globs to THIS file's directory so Tailwind scans the right
// source tree regardless of process.cwd(). Tailwind resolves relative `content`
// globs against process.cwd(), which silently yields zero utilities when a tool
// launches vite from another directory (e.g. the sibling Laravel repo's preview
// runner). The relative globs below remain for the normal `npm run dev`/build
// path; the absolute, forward-slash-normalized ones are an additive fallback.
const here = dirname(fileURLToPath(import.meta.url));
const fromHere = (p) => resolve(here, p).replace(/\\/g, '/');

/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source + the entry HTML so JIT picks up every class we use.
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    fromHere('index.html'),
    fromHere('src/**/*.{js,jsx,ts,tsx}'),
  ],
  // Class-based dark mode: a `.dark` on <html> flips every semantic token
  // (defined in src/styles/tokens.css) and every `dark:` variant. The toggle
  // lives in the header; useTheme persists the choice and respects the OS
  // preference on first load.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ---- Palette (concrete shades — used directly by legacy components)
        espresso: {
          50:  '#faf6f2',
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

        // ---- Semantic aliases (the API the primitives consume)
        // Wired to CSS variables so swapping a palette doesn't ripple
        // through every primitive class string.
        surface:           'var(--color-surface)',
        'surface-muted':   'var(--color-surface-muted)',
        'surface-elevated':'var(--color-surface-elevated)',

        fg:           'var(--color-fg)',
        'fg-muted':   'var(--color-fg-muted)',
        'fg-subtle':  'var(--color-fg-subtle)',

        border:          'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',

        accent:        'var(--color-accent)',
        'accent-hover':'var(--color-accent-hover)',
        'accent-fg':   'var(--color-accent-fg)',

        success:    'var(--color-success)',
        'success-fg': 'var(--color-success-fg)',
        warning:    'var(--color-warning)',
        'warning-fg': 'var(--color-warning-fg)',
        danger:     'var(--color-danger)',
        'danger-fg': 'var(--color-danger-fg)',
        info:       'var(--color-info)',
        'info-fg':  'var(--color-info-fg)',
      },

      // ---- Type — Inter as body, explicit line-heights for the scale
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
               'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem' }],
      },

      // ---- Radius — match what already ships in the app
      borderRadius: {
        sm:   '0.25rem',
        md:   '0.375rem',
        lg:   '0.5rem',
        xl:   '0.75rem',
        '2xl':'1rem',
        full: '9999px',
      },

      // ---- Shadow — keep the existing four; do not invent new ones
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
