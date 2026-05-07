/**
 * Haversine distance between two (lat, lng) points in kilometres.
 * Pure function; no Earth radius arguments to fiddle with — used only
 * for sorting purposes where 4-digit precision is irrelevant.
 */
const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

/** Format a kilometer count to a short user-facing string.
 *  Sub-km gets metre-precision; ultra-close (<50m) is suppressed because
 *  it usually means "both points are city-centre fallbacks", not "we're
 *  literally on top of each other". User then knows to enable precise GPS.
 */
export function formatKm(km) {
  if (km == null) return '—';
  if (km < 0.05) return '~here';     // both points likely city-centre fallback
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  if (km < 100) return `${Math.round(km)} km`;
  return `${Math.round(km / 10) * 10} km`;
}
