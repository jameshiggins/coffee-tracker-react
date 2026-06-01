import { useCallback, useEffect, useState } from 'react';

/**
 * Light/dark theme state.
 *
 * Source of truth is the `.dark` class on <html> (set pre-paint by the inline
 * script in index.html to avoid a flash). This hook owns the runtime toggle
 * and persistence:
 *   - first load: saved choice in localStorage, else the OS preference;
 *   - explicit toggle: writes localStorage so the choice sticks;
 *   - OS change: followed ONLY while the user hasn't made an explicit choice.
 *
 * Keep a single consumer (the header's ThemeToggle). Multiple independent
 * instances would each hold their own useState and could drift — promote to a
 * context provider before adding a second consumer.
 */
const KEY = 'roastmap_theme';

function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function readInitial() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage blocked (private mode / SSR) — fall through */
  }
  return systemPrefersDark() ? 'dark' : 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  // Keep the mobile address-bar / status-bar tint in sync with the theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#15100d' : '#6f4326');
}

export function useTheme() {
  const [theme, setThemeState] = useState(readInitial);

  // Sync the DOM whenever theme changes (covers toggle + OS-follow).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow OS changes only when the user hasn't pinned a preference.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      try {
        if (localStorage.getItem(KEY)) return; // user pinned a choice
      } catch {
        /* ignore */
      }
      setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
}
