import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: the design-system showcase (_showcase.html) is intentionally NOT
// a build input — it was only here to ship the src/ui primitives into the
// prod bundle (defeating tree-shaking) even though the live app didn't use
// them. That dead weight is now removed from the prod build; the showcase
// is still viewable via the dev server. The live app pulls in primitives
// directly as it adopts them.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        // Split Radix + Floating UI into a long-lived, separately-cacheable
        // `ui-vendor` chunk, fetched only when a page that uses those
        // primitives loads.
        //
        // NOTE: Leaflet is deliberately NOT a named manualChunk. A named
        // vendor chunk reachable from the landing route gets hoisted by Vite
        // into the entry HTML as `<link rel="modulepreload">` + a
        // render-blocking `<link rel="stylesheet">` — which would eagerly pull
        // the ~99 KB-gzip map vendor (and its CSS) on every visit, defeating
        // the MapPage facade. Leaving Leaflet unnamed keeps it inside the async
        // LeafletMap chunk, loaded via Vite's runtime preload helper only when
        // the visitor actually activates the map.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@radix-ui') || id.includes('@floating-ui')) return 'ui-vendor';
        },
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
