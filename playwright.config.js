import { defineConfig, devices } from '@playwright/test';

// Browser-level layout tests. The Vitest suite runs in jsdom, which has no
// layout engine: it can prove the right text is in the DOM but not that two
// labels landed on top of each other, that a row overflows a phone screen, or
// that a truncation actually truncates. These tests build the real bundle,
// serve it, drive real Chromium at phone and desktop sizes against a mocked
// API, and assert geometry (see e2e/support/layout.js).
//
//   npm run test:e2e             # both viewports, headless
//   npm run test:e2e -- --ui     # Playwright UI mode
//   npx playwright show-report   # after a failure in CI (artifact)
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // A narrow, touch phone in dark mode — the combination the pinned-roasters
    // header overlap shipped under.
    { name: 'mobile', use: { ...devices['Pixel 7'], colorScheme: 'dark' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
  ],
  webServer: {
    // Production build (not the dev server) so the CSS the tests measure is the
    // CSS that ships: Tailwind purging, minification, chunking all included.
    // Separate outDir so a local `npm run build` and this never clobber each
    // other. VITE_API_BASE points at a host that only exists inside the tests
    // (page.route intercepts it) so nothing can reach a real API.
    command: `npm run build -- --outDir dist-e2e && npm run preview -- --outDir dist-e2e --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_BASE: 'http://api.test' },
    timeout: 180_000,
  },
});
