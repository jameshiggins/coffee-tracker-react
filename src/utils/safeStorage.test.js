import { describe, it, expect, afterEach } from 'vitest';
import { safeLocal } from './safeStorage.js';

afterEach(() => {
  try { window.localStorage.clear(); } catch { /* ignore */ }
});

describe('safeStorage', () => {
  it('reads and writes normally when storage works', () => {
    expect(safeLocal.set('x', '1')).toBe(true);
    expect(safeLocal.get('x')).toBe('1');
    safeLocal.remove('x');
    expect(safeLocal.get('x')).toBeNull();
  });

  it('never throws and degrades to null when the storage accessor throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError: storage blocked'); },
    });
    try {
      expect(() => safeLocal.get('k')).not.toThrow();
      expect(safeLocal.get('k')).toBeNull();
      expect(safeLocal.set('k', 'v')).toBe(false);
      expect(() => safeLocal.remove('k')).not.toThrow();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
