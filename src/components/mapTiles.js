/**
 * Basemap tile-layer selection for LeafletMap.
 *
 * CARTO started enforcing API keys on basemaps.cartocdn.com in late August
 * 2026: anonymous tile requests still render but carry a repeated
 * "API KEY REQUIRED" watermark. A key is free (5M tiles/month, requested by
 * email at https://carto.com/basemaps/apikey/) and is passed as `?key=` on
 * the same tile URL.
 *
 * With VITE_CARTO_API_KEY set (Vercel env for prod, .env.local for dev) we
 * keep the theme-matched CARTO light/dark styles. Without it we fall back to
 * the OpenStreetMap standard tiles — keyless, but light-only, so dark mode
 * inverts them via the `map-tiles--inverted` CSS class in
 * leaflet-overrides.css. OSM's tile usage policy is fine for this site's
 * traffic but asks for attribution and a real Referer, both of which a
 * browser request provides.
 *
 * Pure (no Leaflet import) so it stays unit-testable and out of the lazy map
 * chunk's critical path.
 */

const CARTO = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd',
  maxZoom: 20,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

// OSM retired the a/b/c subdomains; the bare host is the supported endpoint.
const OSM = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const INVERTED_TILES_CLASS = 'map-tiles--inverted';

export function readCartoKey(env = import.meta.env) {
  const key = env?.VITE_CARTO_API_KEY;
  return typeof key === 'string' && key.trim() !== '' ? key.trim() : null;
}

/**
 * @param {{ isDark: boolean, cartoKey?: string | null }} opts
 * @returns {{ provider: 'carto' | 'osm', url: string, attribution: string,
 *            subdomains?: string, maxZoom: number, className?: string }}
 */
export function resolveTileLayer({ isDark, cartoKey = readCartoKey() }) {
  if (cartoKey) {
    const base = isDark ? CARTO.dark : CARTO.light;
    return {
      provider: 'carto',
      url: `${base}?key=${encodeURIComponent(cartoKey)}`,
      attribution: CARTO.attribution,
      subdomains: CARTO.subdomains,
      maxZoom: CARTO.maxZoom,
    };
  }

  return {
    provider: 'osm',
    url: OSM.url,
    attribution: OSM.attribution,
    maxZoom: OSM.maxZoom,
    className: isDark ? INVERTED_TILES_CLASS : undefined,
  };
}
