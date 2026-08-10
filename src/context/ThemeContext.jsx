import { createContext, useContext } from 'react';
import { useTheme } from '../hooks/useTheme.js';

/**
 * App-wide theme state. useTheme() warns it must have a SINGLE consumer —
 * multiple hook instances each hold their own useState and drift. This
 * provider is that single consumer; everything else (ThemeToggle, the map's
 * tile-layer switcher, …) reads the shared value from context.
 */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be inside <ThemeProvider>');
  return ctx;
}
