import { describe, it, expect } from 'vitest';
import {
  ALL_FILTER_KEYS,
  LABELS,
  MULTI_KEYS,
  BOOLEAN_KEYS,
  parseList,
  CPG_TIERS,
  cpgTier,
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

describe('cpgTier', () => {
  it('returns null for null/0/undefined (no priceable variant)', () => {
    expect(cpgTier(null)).toBe(null);
    expect(cpgTier(undefined)).toBe(null);
    expect(cpgTier(0)).toBe(null);
  });

  it('buckets each tier at its boundaries (lower-inclusive, upper-exclusive)', () => {
    // <6¢/g
    expect(cpgTier(0.01)).toBe('lt6');
    expect(cpgTier(5.9)).toBe('lt6');
    // 6–8¢/g — 6 is the lower edge of this tier, not the top of lt6
    expect(cpgTier(6)).toBe('6-8');
    expect(cpgTier(7.99)).toBe('6-8');
    // 8–10¢/g
    expect(cpgTier(8)).toBe('8-10');
    expect(cpgTier(9.99)).toBe('8-10');
    // 10¢+/g — open-ended top tier
    expect(cpgTier(10)).toBe('gte10');
    expect(cpgTier(25)).toBe('gte10');
  });

  it('every CPG_TIERS value is reachable via cpgTier', () => {
    const produced = new Set([
      cpgTier(5.9), cpgTier(6), cpgTier(8), cpgTier(10),
    ]);
    for (const t of CPG_TIERS) {
      expect(produced.has(t.value), `tier "${t.value}" never produced`).toBe(true);
    }
  });
});
