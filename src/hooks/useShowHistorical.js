import { useEffect, useState } from 'react';

const KEY = 'coffee_tracker_show_historical';

/**
 * Site-wide preference: include "historical" coffees in the directory.
 * Historical = currently out of stock OR soft-removed by a roaster
 * (no-longer-sold). Default OFF — directory shows only currently-buyable.
 *
 * The semantics deliberately combine the two states. Users almost always
 * want either "what can I buy right now" (off) or "the full archive of
 * what has ever been on this site, including beans I tasted last year"
 * (on). The middle state — sold-out-but-still-listed — wasn't worth a
 * separate toggle.
 *
 * Persisted in localStorage so the toggle sticks across page navigations.
 */
export function useShowHistorical() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, show ? '1' : '0');
    } catch {
      // localStorage unavailable (Safari private mode, SSR) — session-only.
    }
  }, [show]);

  return [show, setShow];
}

// Back-compat alias so any stale callers keep working until they're migrated.
export const useShowOutOfStock = useShowHistorical;
