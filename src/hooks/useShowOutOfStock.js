import { useEffect, useState } from 'react';

const KEY = 'coffee_tracker_show_oos';

/**
 * Site-wide preference: should the directory display coffees that are
 * currently sold out across every variant? Default OFF (Q3 (c)).
 *
 * Persisted in localStorage so the toggle sticks across page navigations.
 * Returns [showOutOfStock: boolean, setShowOutOfStock: (boolean) => void].
 */
export function useShowOutOfStock() {
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
      // localStorage unavailable (Safari private mode, SSR) — preference is
      // session-only. Acceptable.
    }
  }, [show]);

  return [show, setShow];
}
