import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/leaflet-overrides.css'; // mobile#6: must load AFTER leaflet.css
import ClusterLayer from './ClusterLayer.jsx';
import { resolveTileLayer } from './mapTiles.js';

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
export default function LeafletMap({
  markers,
  targetBounds,
  isDark = false,
  focusOnMount = false,
}) {
  const tiles = resolveTileLayer({ isDark });
  return (
    <MapContainer
      center={[56, -106]}
      zoom={4}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      {/* key-remount on theme change: react-leaflet does NOT propagate a
          mutated `url` prop to a live tile layer, so swapping themes in
          place silently no-ops. A fresh layer per theme is cheap and safe.
          Provider + URL come from mapTiles.js (CARTO with an API key, else
          keyless OSM) — see that file for why. */}
      <TileLayer
        key={`${tiles.provider}-${isDark ? 'dark' : 'light'}`}
        url={tiles.url}
        attribution={tiles.attribution}
        subdomains={tiles.subdomains}
        maxZoom={tiles.maxZoom}
        className={tiles.className}
      />
      <MapBoundsController targetBounds={targetBounds} />
      <FocusOnReady enabled={focusOnMount} />
      <ClusterLayer markers={markers} />
    </MapContainer>
  );
}
