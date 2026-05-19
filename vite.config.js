import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        // The live app.
        main: resolve(__dirname, 'index.html'),
        // Design-system showcase. Builds into dist/_showcase.html as a
        // separate bundle so the primitives are present in the build
        // (defeats tree-shaking) without being loaded by the live app.
        showcase: resolve(__dirname, '_showcase.html'),
      },
    },
  },
  test: {
    // jsdom so DOM-touching primitive tests work; existing util tests don't
    // care about the environment, so flipping the global default is safe.
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
  },
});
