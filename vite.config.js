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
        // Split the heaviest third-party libs into their own long-lived,
        // separately-cacheable chunks. Combined with the route-level lazy
        // imports in App.jsx, `map-vendor` (Leaflet + markercluster +
        // react-leaflet) is fetched only when the map route mounts, and
        // `ui-vendor` (Radix + its Floating UI dep) only when a page that
        // uses those primitives loads. App code churns far more often than
        // these deps, so isolating them keeps repeat-visit cache hits high.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('leaflet')) return 'map-vendor'; // matches react-leaflet + leaflet.markercluster
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
