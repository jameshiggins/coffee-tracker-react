import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'coffee_tracker_location';

/**
 * Synchronously read the persisted location (or null) from localStorage.
 * Exposed so callers can make a first-render decision (e.g. default the sort
 * to nearest-first when an explicit location is already saved) without waiting
 * for the hook to mount.
 */
export function readStoredLocation() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Shared store ─────────────────────────────────────────────────────────
// Location is APP-WIDE state: the LocationChip sets it, and the Roasters/Beans/
// Map pages read it to sort + measure distance. Backing it with a single module
// store (rather than a per-component useState) means every consumer sees the
// SAME value and re-renders together the instant it changes — so picking a city
// in the chip immediately re-sorts the roaster list from that city. It also
// collapses what used to be one IP lookup PER consumer into a single shared one.
let store = readStoredLocation();
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return store;
}

/** Update the shared location (or clear with null) + persist, then notify. */
function writeLocation(next) {
  store = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode / quota — in-memory value still applies for this session */
  }
  emit();
}

// One-time, app-wide IP fallback. Runs at most once per page load, and only if
// no location is already known (persisted override or a prior lookup).
let ipLookupStarted = false;
function maybeStartIpLookup() {
  if (ipLookupStarted || store) return;
  ipLookupStarted = true;
  fetch('https://ipapi.co/json/')
    .then((r) => (r.ok ? r.json() : Promise.reject(r)))
    .then((d) => {
      // Don't clobber a location the user set while the request was in flight.
      if (store) return;
      if (d?.latitude && d?.longitude) {
        writeLocation({
          lat: Number(d.latitude),
          lng: Number(d.longitude),
          label: [d.city, d.region].filter(Boolean).join(', '),
          source: 'ip',
        });
      }
    })
    .catch(() => {
      /* network blocked / rate-limit / privacy ext — silent; stays alphabetical */
    });
}

/**
 * Q11+Q12a: best-effort user location for nearest-first sort. Reads any
 * persisted override from localStorage first; if none, hits ipapi.co once
 * (app-wide) to get an approximate city-level lat/lng. The user can override
 * via the LocationChip — the override is what persists.
 *
 * Returns { location: {lat, lng, label, source} | null, setLocation,
 * clearLocation, requestPreciseLocation }. `source` is 'ip' (auto-detected),
 * 'manual' (picked a city), or 'gps' (precise) — callers use it to distinguish
 * an explicit choice from a passive guess.
 *
 * Failure mode: if ipapi is blocked / errors, location stays null and the rest
 * of the app falls back to alphabetical sort. No user-visible error.
 */
export function useUserLocation() {
  const location = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    maybeStartIpLookup();
  }, []);

  /**
   * Ask the browser for high-accuracy device location. Requires user
   * permission grant. Returns a promise that resolves with the new location or
   * rejects on denial / unavailability. Result persists so we don't re-prompt.
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
          writeLocation(next);
          resolve(next);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  return {
    location,
    setLocation: writeLocation,
    clearLocation: () => writeLocation(null),
    requestPreciseLocation,
  };
}
