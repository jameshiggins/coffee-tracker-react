import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
// NOTE: react-leaflet-cluster@4 wants @react-leaflet/core@^3, but we're on
// react-leaflet@4 which provides core@^2. The peer mismatch causes the
// cluster wrapper to silently render no children. With 63 roasters,
// clustering isn't needed for performance — markers render fine at country
// zoom without it. Add clustering back via react-leaflet-cluster@2.x when
// we revisit. Tracked: see TODO list.

import { api } from '../api.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import { isCoffeeInStock } from '../utils/stock.js';
import {
  PROVINCE_BOUNDS,
  CANADA_BOUNDS,
  provinceForLatLng,
  provinceCodeForName,
} from '../utils/provinceBounds.js';
import { beanIcon } from '../components/MapMarkerIcon.jsx';
import MapPopupCard from '../components/MapPopupCard.jsx';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Imperatively re-fits the map when the target bounds change.
 * Has to live inside <MapContainer> to access useMap().
 */
function MapBoundsController({ targetBounds }) {
  const map = useMap();
  useEffect(() => {
    if (!targetBounds) return;
    map.fitBounds(targetBounds, { padding: [40, 40], animate: true, duration: 0.6 });
  }, [targetBounds, map]);
  return null;
}

export default function MapPage() {
  const { location } = useUserLocation();
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeRoasterId, setActiveRoasterId] = useState(null);

  useEffect(() => {
    api.listRoasters()
      .then((d) => setRoasters(d.roasters))
      .catch((e) => setError(e.message));
  }, []);

  // From IP geo: which province is the user in?
  const userProvince = useMemo(
    () => (location ? provinceForLatLng(location.lat, location.lng) : null),
    [location]
  );

  // Which bounds should the map fit?
  // 1. Sidebar selection wins
  // 2. Else, IP-derived province
  // 3. Else, all-Canada
  const targetBounds = useMemo(() => {
    if (selectedRegion && PROVINCE_BOUNDS[selectedRegion]) {
      return L.latLngBounds(PROVINCE_BOUNDS[selectedRegion].bounds);
    }
    if (userProvince && PROVINCE_BOUNDS[userProvince]) {
      return L.latLngBounds(PROVINCE_BOUNDS[userProvince].bounds);
    }
    return L.latLngBounds(CANADA_BOUNDS);
  }, [selectedRegion, userProvince]);

  const matchesRegion = (r) =>
    !selectedRegion ||
    r.region === selectedRegion ||
    provinceCodeForName(r.region) === selectedRegion;

  // Markers: roasters that ship + match region + have coordinates.
  const visibleRoasters = useMemo(() => {
    if (!roasters) return [];
    return roasters
      .filter((r) => r.has_shipping)
      .filter(matchesRegion)
      .filter((r) => r.latitude != null && r.longitude != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roasters, selectedRegion]);

  // The "+ N not on map" pill counts roasters that match the region
  // filter but lack coordinates — we surface them with a link to the
  // grid so users don't think the directory is incomplete.
  const notOnMapCount = useMemo(() => {
    if (!roasters) return 0;
    return roasters
      .filter((r) => r.has_shipping)
      .filter(matchesRegion)
      .filter((r) => r.latitude == null || r.longitude == null)
      .length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roasters, selectedRegion]);

  // Province sidebar entries — sorted by count desc so the busiest
  // provinces (BC, ON, QC) appear first.
  const availableRegions = useMemo(() => {
    if (!roasters) return [];
    const counts = new Map();
    for (const r of roasters) {
      if (!r.has_shipping || !r.region) continue;
      const code = provinceCodeForName(r.region) || r.region;
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([code, count]) => ({
        code,
        name: PROVINCE_BOUNDS[code]?.name || code,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [roasters]);

  const allShippingCount = roasters
    ? roasters.filter((r) => r.has_shipping).length
    : 0;

  if (error) {
    return (
      <div className="p-10 text-center text-red-700">
        <h3 className="font-bold mb-2">Failed to load</h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-600 mt-3">
          Make sure the API is reachable at {import.meta.env.VITE_API_BASE || 'localhost:8000'}.
        </p>
      </div>
    );
  }
  if (!roasters) {
    return <div className="p-10 text-center text-amber-800">Loading map…</div>;
  }

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}
    >
      <aside className="md:w-56 md:border-r border-amber-100 p-4 overflow-y-auto bg-amber-50/30 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
          Province
        </h3>
        <div className="flex flex-col gap-1">
          <FilterChip
            label="All Canada"
            count={allShippingCount}
            active={selectedRegion === null}
            onClick={() => setSelectedRegion(null)}
          />
          {availableRegions.map((r) => (
            <FilterChip
              key={r.code}
              label={r.name}
              count={r.count}
              active={selectedRegion === r.code}
              onClick={() => setSelectedRegion(r.code)}
            />
          ))}
        </div>

        {notOnMapCount > 0 && (
          <Link
            to={`/roasters${selectedRegion ? `?region=${selectedRegion}` : ''}`}
            className="mt-4 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full
                       bg-amber-100 text-amber-800 text-xs font-medium
                       hover:bg-amber-200 transition-colors"
            title="Some roasters in this region don't have a precise location yet — view them in the grid."
          >
            +{notOnMapCount} not on map
          </Link>
        )}

        {visibleRoasters.length === 0 && (
          <p className="mt-6 text-xs text-amber-700/80">
            No roasters with map locations match this region yet.
          </p>
        )}
      </aside>

      <div className="flex-1 relative" style={{ minHeight: 480 }}>
        <MapContainer
          center={[56, -106]}
          zoom={4}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
          <MapBoundsController targetBounds={targetBounds} />
          {visibleRoasters.map((r) => {
            const inStockCount = (r.coffees || []).filter(isCoffeeInStock).length;
            // Per-roaster rotation so markers don't all face the same way.
            const rotation = -50 + ((r.id * 17) % 50);
            return (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={beanIcon({ active: r.id === activeRoasterId, rotation })}
                eventHandlers={{
                  popupopen: () => setActiveRoasterId(r.id),
                  popupclose: () => setActiveRoasterId(null),
                }}
              >
                <Popup minWidth={240} maxWidth={280} closeButton autoPan>
                  <MapPopupCard roaster={r} inStockCount={inStockCount} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
        active
          ? 'bg-amber-800 text-white font-semibold'
          : 'text-amber-900 hover:bg-amber-100'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs tabular-nums ${active ? 'text-amber-100' : 'text-amber-600'}`}>
        {count}
      </span>
    </button>
  );
}
