# coffee-tracker-react

User-facing app for a directory of Canadian specialty coffee roasters. Pairs with the Laravel API at [`coffee-tracker-laravel`](https://github.com/jameshiggins/coffee-tracker-laravel).

## What it does

- **`/`** — roaster directory, filterable, with map (Leaflet) and nearest-first sort via IP geolocation or browser GPS.
- **`/beans`** — the canonical browse page. Multi-select dropdown filters (Type / Roast / Region / Process / Varietal / Elevation / Tasting note), c3 expansion pattern (one card open at a time), color-coded tasting note chips driven by the SCA Flavor Wheel.
- **`/c/<id>`**, **`/t/<id>`**, **`/u/<displayName>`** — coffee detail, tasting permalink, and public profile pages.
- **Auth-gated** wishlists, tasting log, and restock alerts.

## Stack

- React 18, Vite 5, react-router 6
- Tailwind via CDN (no build step for styles)
- Leaflet for maps
- Vitest for tests

## Run locally

```bash
npm install
cp .env.example .env.local      # then edit VITE_API_BASE if needed
npm run dev                     # :5174
```

Requires the Laravel API running at `VITE_API_BASE` (default `http://localhost:8000`).

## Tests + build

```bash
npm run lint      # eslint (errors fail, warnings pass)
npm run typecheck # tsc --noEmit
npm test          # Vitest + Testing Library, jsdom
npm run test:e2e  # Playwright layout tests, real Chromium (see below)
npm run build     # production bundle to dist/
```

CI runs all of these on every push and pull request to `main`.

### Layout tests (`e2e/`)

The Vitest suite runs in jsdom, which has no layout engine: it can prove the
right text is in the DOM but not that two labels landed on top of each other
or that a row pushed the page sideways on a phone. `npm run test:e2e` builds
the real bundle, serves it, and drives Chromium at a phone width (Pixel 7,
dark mode) and a desktop width against a mocked API (`e2e/support/mockApi.js`,
no network). Each scenario asserts geometry with the helpers in
`e2e/support/layout.js`:

- `expectNoTextOverlap(page, root)` walks every rendered text node and fails
  if any two, from different elements, are painted on top of each other.
- `expectNoHorizontalOverflow(page)` fails if the document scrolls sideways.

Add a scenario whenever a page gains a new layout state (a new header, a
collapsible group, a badge that can hold a long string). First run needs the
browser: `npx playwright install chromium`.

## Deploy

Targeted at Vercel — auto-detects Vite, uses the `npm run build` command, serves `dist/`. Set `VITE_API_BASE` to the production Laravel URL in Vercel project settings.

Also set `VITE_CARTO_API_KEY` (free key from <https://carto.com/basemaps/apikey/>) so the map uses CARTO's theme-matched light/dark basemaps. Without it the map falls back to OpenStreetMap's keyless tiles (dark mode inverts them via CSS) — see `src/components/mapTiles.js`.

## License

MIT
