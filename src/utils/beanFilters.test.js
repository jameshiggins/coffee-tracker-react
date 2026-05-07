import { describe, it, expect } from 'vitest';
import {
  ALL_FILTER_KEYS,
  LABELS,
  MULTI_KEYS,
  BOOLEAN_KEYS,
  parseList,
} from './beanFilters.js';

/**
 * Invariants that prevent the "raw URL-key leaking into the UI" class
 * of bug. If a future filter is added without registering it everywhere,
 * one of these tests will fail before the chip ever ships.
 */
describe('beanFilters metadata invariants', () => {
  it('every filter key has a friendly label', () => {
    for (const key of ALL_FILTER_KEYS) {
      expect(LABELS[key], `missing LABELS entry for "${key}"`).toBeTruthy();
      expect(typeof LABELS[key]).toBe('string');
    }
  });

  it('every label corresponds to a registered filter key (no orphans)', () => {
    for (const labelKey of Object.keys(LABELS)) {
      expect(
        ALL_FILTER_KEYS.includes(labelKey),
        `LABELS["${labelKey}"] exists but the key isn't in ALL_FILTER_KEYS`
      ).toBe(true);
    }
  });

  it('every MULTI_KEYS member is a registered filter key', () => {
    for (const key of MULTI_KEYS) {
      expect(ALL_FILTER_KEYS.includes(key), `MULTI key "${key}" not in ALL_FILTER_KEYS`).toBe(true);
    }
  });

  it('every BOOLEAN_KEYS member is a registered filter key', () => {
    for (const key of BOOLEAN_KEYS) {
      expect(ALL_FILTER_KEYS.includes(key), `BOOLEAN key "${key}" not in ALL_FILTER_KEYS`).toBe(true);
    }
  });

  it('a key cannot be both multi-select and boolean', () => {
    for (const key of BOOLEAN_KEYS) {
      expect(MULTI_KEYS.has(key), `"${key}" can't be both multi and boolean`).toBe(false);
    }
  });
});

describe('parseList', () => {
  it('returns empty for null/empty', () => {
    expect(parseList(null)).toEqual([]);
    expect(parseList('')).toEqual([]);
    expect(parseList(undefined)).toEqual([]);
  });
  it('splits on commas and trims whitespace', () => {
    expect(parseList('Ethiopia, Colombia, Kenya')).toEqual(['Ethiopia', 'Colombia', 'Kenya']);
  });
  it('drops empty fragments', () => {
    expect(parseList(',foo,,bar,')).toEqual(['foo', 'bar']);
  });
});
