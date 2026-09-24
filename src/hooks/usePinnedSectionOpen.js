import { useCallback, useState } from 'react';

export const PINNED_SECTION_OPEN_KEY = 'roastmap:pinnedRoastersOpen';

/**
 * Whether the visitor has explicitly opened or closed the pinned-roasters
 * group on the directory. Tri-state: true / false / null (never chosen).
 * The page decides the default from the pin count; this only remembers an
 * explicit choice, in localStorage so it sticks across visits. Storage
 * failures (Safari private mode, blocked site data) degrade to session-only.
 */
export function usePinnedSectionOpen() {
  const [pref, setPref] = useState(() => {
    try {
      const v = localStorage.getItem(PINNED_SECTION_OPEN_KEY);
      return v === '1' ? true : v === '0' ? false : null;
    } catch {
      return null;
    }
  });

  const set = useCallback((open) => {
    setPref(open);
    try {
      localStorage.setItem(PINNED_SECTION_OPEN_KEY, open ? '1' : '0');
    } catch {
      // localStorage unavailable — the choice lasts for this session only.
    }
  }, []);

  return [pref, set];
}
