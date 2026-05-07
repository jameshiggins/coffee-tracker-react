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

  /**
   * Ask the browser for high-accuracy device location. Requires user
   * permission grant. Returns a promise that resolves with the new
   * location or rejects on denial / unavailability.
   *
   * Use this when the user wants meter-accurate distance instead of the
   * city-level IP fallback. Result is persisted to localStorage so we
   * don't re-prompt on every visit.
   */
  function requestPreciseLocation() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation API unavailable'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: 'My location',
            source: 'gps',
            accuracy_m: Math.round(pos.coords.accuracy ?? 0),
          };
          setLocation(next);
          resolve(next);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  return {
    location,
    setLocation,
    clearLocation: () => setLocation(null),
    requestPreciseLocation,
  };
}
