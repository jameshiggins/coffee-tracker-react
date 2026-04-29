import { useEffect, useState } from 'react';

const KEY = 'coffee_tracker_location';

/**
 * Q11+Q12a: best-effort user location for nearest-first sort. Reads any
 * persisted override from localStorage first; if none, hits ipapi.co
 * once on mount to get an approximate city-level lat/lng. The user can
 * override via the header chip — the override is what persists.
 *
 * Returns { location: {lat, lng, label} | null, setLocation, clearLocation }
 *
 * Failure mode: if ipapi is blocked / errors, location stays null and
 * the rest of the app falls back to alphabetical sort. No user-visible
 * error — sort just isn't location-aware.
 */
export function useUserLocation() {
  const [location, setLocationState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (location) return; // already set (manual override or previous IP lookup)
    let cancelled = false;
    fetch('https://ipapi.co/json/')
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => {
        if (cancelled) return;
        if (d?.latitude && d?.longitude) {
          const next = {
            lat: Number(d.latitude),
            lng: Number(d.longitude),
            label: [d.city, d.region].filter(Boolean).join(', '),
            source: 'ip',
          };
          setLocationState(next);
          try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        }
      })
      .catch(() => { /* network blocked / rate-limit / privacy ext — silent */ });
    return () => { cancelled = true; };
  }, [location]);

  function setLocation(next) {
    setLocationState(next);
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {}
  }

  return { location, setLocation, clearLocation: () => setLocation(null) };
}
