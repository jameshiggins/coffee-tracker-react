import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/leaflet-overrides.css'; // mobile#6: must load AFTER leaflet.css
import ClusterLayer from './ClusterLayer.jsx';

// Theme-matched CARTO basemaps. Everything else on the map (popups, markers,
// clusters) themes itself via CSS tokens in leaflet-overrides.css; the raster
// tiles are the one piece that needs an explicit URL swap.
const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Imperatively re-fits the map when the target bounds change. Must live inside
 * <MapContainer> to access useMap(). `targetBounds` is a raw [[s,w],[n,e]]
 * array — kept Leaflet-free in MapPage so the page chunk never pulls in the map
 * vendor before the visitor activates the map. Leaflet's fitBounds accepts the
 * array form directly.
 */
function MapBoundsController({ targetBounds }) {
  const map = useMap();
  useEffect(() => {
    if (!targetBounds) return;
    map.fitBounds(targetBounds, { padding: [40, 40], animate: true, duration: 0.6 });
  }, [targetBounds, map]);
  return null;
}

/**
 * a11y: when the visitor activated the map facade from the KEYBOARD, move
 * focus into the map container once it mounts — otherwise they're left
 * where the (now unmounted) facade button was, with no way to reach the
 * arrow-key pan / +- zoom Leaflet provides.
 */
function FocusOnReady({ enabled }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) map.getContainer().focus();
  }, [enabled, map]);
  return null;
}

/**
 * The interactive Leaflet map, code-split into its own chunk.
 *
 * Perf: Leaflet + markercluster + react-leaflet is ~99 KB gzip — the single
 * heaviest payload on the site and (as a map tile) the LCP element on the
 * landing route. MapPage mounts this lazily behind a facade on the visitor's
 * first interaction, so the landing page paints instantly and this vendor
 * weight stays off the critical path entirely.
 */
export default function LeafletMap({ markers, targetBounds, isDark = false, focusOnMount = false }) {
  return (
    <MapContainer
      center={[56, -106]}
      zoom={4}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      {/* key-remount on theme change: react-leaflet does NOT propagate a
          mutated `url` prop to a live tile layer, so swapping themes in
          place silently no-ops. A fresh layer per theme is cheap and safe. */}
      <TileLayer
        key={isDark ? 'dark' : 'light'}
        url={isDark ? TILE_URLS.dark : TILE_URLS.light}
        attribution={TILE_ATTR}
      />
      <MapBoundsController targetBounds={targetBounds} />
      <FocusOnReady enabled={focusOnMount} />
      <ClusterLayer markers={markers} />
    </MapContainer>
  );
}
