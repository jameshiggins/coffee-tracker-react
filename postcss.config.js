import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Tailwind's PostCSS plugin auto-resolves tailwind.config.js from process.cwd().
// That breaks when a tool launches vite from another directory (e.g. the sibling
// Laravel repo's preview runner): Tailwind can't find the config, silently falls
// back to its default empty-content config, and emits preflight with zero
// utilities. Pin the config to an absolute, CWD-independent path so it always
// loads the right file. (A plain file path is fine on Windows — no glob escaping.)
const here = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: resolve(here, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
