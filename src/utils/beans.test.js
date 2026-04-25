import { describe, it, expect } from 'vitest';
import { originCountry, tastingTokens, flattenBeans, uniqueSorted } from './beans.js';

describe('originCountry', () => {
  it('extracts the country before the first comma', () => {
    expect(originCountry('Ethiopia, Yirgacheffe')).toBe('Ethiopia');
  });

  it('extracts the country before the first slash for multi-origin strings', () => {
    expect(originCountry('Brazil / Colombia')).toBe('Brazil');
  });

  it('returns the whole string when no separator', () => {
    expect(originCountry('Kenya')).toBe('Kenya');
  });

  it('returns null for null/empty input', () => {
    expect(originCountry(null)).toBeNull();
    expect(originCountry('')).toBeNull();
    expect(originCountry('   ')).toBeNull();
  });
});

describe('tastingTokens', () => {
  it('splits on commas, lowercases, trims', () => {
    expect(tastingTokens('Strawberry jam, lemon verbena, wine'))
      .toEqual(['strawberry jam', 'lemon verbena', 'wine']);
  });

  it('splits on " and " as well as commas', () => {
    expect(tastingTokens('Chocolate and caramel, hazelnut'))
      .toEqual(['chocolate', 'caramel', 'hazelnut']);
  });

  it('returns empty array for null', () => {
    expect(tastingTokens(null)).toEqual([]);
    expect(tastingTokens('')).toEqual([]);
  });

  it('drops single-character noise', () => {
    expect(tastingTokens('a, blueberry, b')).toEqual(['blueberry']);
  });
});

describe('flattenBeans', () => {
  const sampleRoasters = [
    {
      id: 1, name: 'R1', slug: 'r1', country_code: 'CA', region: 'Vancouver',
      coffees: [
        {
          id: 10, name: 'Yirg', origin: 'Ethiopia, Gedeo', tasting_notes: 'Floral, citrus',
          default_variant: { id: 100, bag_weight_grams: 340, price: 22.0 },
          variants: [
            { id: 99, bag_weight_grams: 250, price: 18.0 },
            { id: 100, bag_weight_grams: 340, price: 22.0 },
          ],
        },
      ],
    },
    {
      id: 2, name: 'R2', slug: 'r2', country_code: 'US', region: null,
      coffees: [
        {
          id: 20, name: 'Brazil Natural', origin: 'Brazil', tasting_notes: null,
          default_variant: null,
          variants: [{ id: 200, bag_weight_grams: 340, price: 19.0 }],
        },
      ],
    },
  ];

  it('produces one bean per coffee across all roasters', () => {
    expect(flattenBeans(sampleRoasters)).toHaveLength(2);
  });

  it('attaches the parent roaster on each bean', () => {
    const beans = flattenBeans(sampleRoasters);
    expect(beans[0].roaster.name).toBe('R1');
    expect(beans[1].roaster.name).toBe('R2');
  });

  it('parses country and tasting tokens', () => {
    const beans = flattenBeans(sampleRoasters);
    expect(beans[0].country).toBe('Ethiopia');
    expect(beans[0].tokens).toEqual(['floral', 'citrus']);
    expect(beans[1].country).toBe('Brazil');
    expect(beans[1].tokens).toEqual([]);
  });

  it('falls back to first variant when default_variant is null', () => {
    const beans = flattenBeans(sampleRoasters);
    expect(beans[1].default_variant.id).toBe(200);
  });

  it('exposes roaster_country and roaster_region for filtering', () => {
    const beans = flattenBeans(sampleRoasters);
    expect(beans[0].roaster_country).toBe('CA');
    expect(beans[0].roaster_region).toBe('Vancouver');
    expect(beans[1].roaster_country).toBe('US');
    expect(beans[1].roaster_region).toBeNull();
  });
});

describe('uniqueSorted', () => {
  it('dedupes, drops falsy, sorts', () => {
    expect(uniqueSorted(['c', 'a', null, 'b', 'a', '', undefined])).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty input', () => {
    expect(uniqueSorted([])).toEqual([]);
  });
});
