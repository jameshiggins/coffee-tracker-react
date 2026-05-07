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
npm test          # 84 Vitest tests
npm run build     # production bundle to dist/
```

CI runs both on every push to `main`.

## Deploy

Targeted at Vercel — auto-detects Vite, uses the `npm run build` command, serves `dist/`. Set `VITE_API_BASE` to the production Laravel URL in Vercel project settings.

## License

MIT
