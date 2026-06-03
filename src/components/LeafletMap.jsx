import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/leaflet-overrides.css'; // mobile#6: must load AFTER leaflet.css
import ClusterLayer from './ClusterLayer.jsx';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
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
 * The interactive Leaflet map, code-split into its own chunk.
 *
 * Perf: Leaflet + markercluster + react-leaflet is ~99 KB gzip — the single
 * heaviest payload on the site and (as a map tile) the LCP element on the
 * landing route. MapPage mounts this lazily behind a facade on the visitor's
 * first interaction, so the landing page paints instantly and this vendor
 * weight stays off the critical path entirely.
 */
export default function LeafletMap({ markers, targetBounds }) {
  return (
    <MapContainer
      center={[56, -106]}
      zoom={4}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <MapBoundsController targetBounds={targetBounds} />
      <ClusterLayer markers={markers} />
    </MapContainer>
  );
}
