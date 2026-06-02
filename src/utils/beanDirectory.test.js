import { describe, it, expect } from 'vitest';
import {
  filterAndSortBeans,
  buildFilterOptions,
  inStockUniverseOf,
  buildSortFn,
  cheapestCpg,
  cheapestPrice,
  referenceVariantFor,
  labelForValue,
  normalize,
  titleCase,
} from './beanDirectory.js';

/* ----------------- fixtures ----------------- */

function mkVariant(o = {}) {
  return { in_stock: true, bag_weight_grams: 340, price: 20, price_per_gram: null, ...o };
}

// Mirrors the shape flattenBeans() produces. `country` is the origin's
// first segment (a display string, not an ISO code) just like the real data.
function mkBean(o = {}) {
  return {
    id: 1,
    name: 'Bean',
    origin: 'Ethiopia',
    country: 'Ethiopia',
    process: 'Washed',
    roast_level: 'Light',
    varietal: 'Heirloom',
    tasting_notes: 'chocolate, floral',
    is_blend: false,
    is_removed: false,
    elevation_meters: 1600,
    rating: null,
    variants: [mkVariant()],
    roaster: { slug: 'roaster-a', name: 'Roaster A', latitude: 49, longitude: -123 },
    ...o,
  };
}

function mkFilters(o = {}) {
  return {
    q: '', country: [], process: [], roast: [], varietal: [],
    note: [], elevation: [], cpg: [], blend: '', roaster: '', ...o,
  };
}

function run(beans, o = {}) {
  return filterAndSortBeans(beans, {
    filters: mkFilters(o.filters),
    sort: o.sort ?? 'name-asc',
    location: o.location ?? null,
    showHistorical: o.showHistorical ?? false,
    similarSeedId: o.similarSeedId ?? null,
  });
}

const ids = (list) => list.map((b) => b.id);

/* ----------------- inStockUniverseOf ----------------- */

describe('inStockUniverseOf', () => {
  it('excludes soft-removed beans', () => {
    const beans = [mkBean({ id: 1 }), mkBean({ id: 2, is_removed: true })];
    expect(ids(inStockUniverseOf(beans, false))).toEqual([1]);
  });

  it('excludes out-of-stock when showHistorical is false', () => {
    const beans = [
      mkBean({ id: 1 }),
      mkBean({ id: 2, variants: [mkVariant({ in_stock: false })] }),
    ];
    expect(ids(inStockUniverseOf(beans, false))).toEqual([1]);
  });

  it('includes out-of-stock when showHistorical is true (but never soft-removed)', () => {
    const beans = [
      mkBean({ id: 1, variants: [mkVariant({ in_stock: false })] }),
      mkBean({ id: 2, is_removed: true }),
    ];
    expect(ids(inStockUniverseOf(beans, true))).toEqual([1]);
  });
});

/* ----------------- filterAndSortBeans: visibility ----------------- */

describe('filterAndSortBeans — default visibility', () => {
  it('hides soft-removed and out-of-stock by default', () => {
    const beans = [
      mkBean({ id: 1, name: 'A' }),
      mkBean({ id: 2, name: 'B', is_removed: true }),
      mkBean({ id: 3, name: 'C', variants: [mkVariant({ in_stock: false })] }),
    ];
    expect(ids(run(beans))).toEqual([1]);
  });

  it('shows everything (incl. removed + sold out) when showHistorical', () => {
    const beans = [
      mkBean({ id: 1, name: 'A' }),
      mkBean({ id: 2, name: 'B', is_removed: true }),
      mkBean({ id: 3, name: 'C', variants: [mkVariant({ in_stock: false })] }),
    ];
    expect(ids(run(beans, { showHistorical: true })).sort()).toEqual([1, 2, 3]);
  });
});

/* ----------------- filterAndSortBeans: each filter ----------------- */

describe('filterAndSortBeans — filters', () => {
  it('roaster filter restricts to one slug', () => {
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'a', name: 'A' } }),
      mkBean({ id: 2, roaster: { slug: 'b', name: 'B' } }),
    ];
    expect(ids(run(beans, { filters: { roaster: 'a' } }))).toEqual([1]);
  });

  it('country is OR-within-field', () => {
    const beans = [
      mkBean({ id: 1, country: 'Colombia' }),
      mkBean({ id: 2, country: 'Ethiopia' }),
      mkBean({ id: 3, country: 'Kenya' }),
    ];
    expect(ids(run(beans, { filters: { country: ['Colombia', 'Ethiopia'] } })).sort())
      .toEqual([1, 2]);
  });

  it('process matches case-insensitively (normalize)', () => {
    const beans = [
      mkBean({ id: 1, process: 'Washed' }),
      mkBean({ id: 2, process: 'Natural' }),
    ];
    expect(ids(run(beans, { filters: { process: ['washed'] } }))).toEqual([1]);
  });

  it('roast matches case-insensitively incl. hyphenated', () => {
    const beans = [
      mkBean({ id: 1, roast_level: 'Medium-Dark' }),
      mkBean({ id: 2, roast_level: 'Light' }),
    ];
    expect(ids(run(beans, { filters: { roast: ['medium-dark'] } }))).toEqual([1]);
  });

  it('varietal matches case-insensitively', () => {
    const beans = [
      mkBean({ id: 1, varietal: 'Pink Bourbon' }),
      mkBean({ id: 2, varietal: 'Geisha' }),
    ];
    expect(ids(run(beans, { filters: { varietal: ['pink bourbon'] } }))).toEqual([1]);
  });

  it('elevation filters by tier', () => {
    const beans = [
      mkBean({ id: 1, elevation_meters: 1600 }), // high
      mkBean({ id: 2, elevation_meters: 1000 }), // low
      mkBean({ id: 3, elevation_meters: null }),  // untiered → excluded
    ];
    expect(ids(run(beans, { filters: { elevation: ['high'] } }))).toEqual([1]);
  });

  it('cpg filters by reference-variant ¢/g tier', () => {
    const beans = [
      mkBean({ id: 1, variants: [mkVariant({ price_per_gram: 5 })] }),  // lt6
      mkBean({ id: 2, variants: [mkVariant({ price_per_gram: 12 })] }), // gte10
    ];
    expect(ids(run(beans, { filters: { cpg: ['lt6'] } }))).toEqual([1]);
  });

  it('blend=single-origin keeps non-blends; blend=blend keeps blends', () => {
    const beans = [
      mkBean({ id: 1, is_blend: false }),
      mkBean({ id: 2, is_blend: true }),
    ];
    expect(ids(run(beans, { filters: { blend: 'single-origin' } }))).toEqual([1]);
    expect(ids(run(beans, { filters: { blend: 'blend' } }))).toEqual([2]);
  });

  it('note is AND-across selected notes, substring within each', () => {
    const beans = [
      mkBean({ id: 1, tasting_notes: 'dark chocolate, jasmine floral' }),
      mkBean({ id: 2, tasting_notes: 'chocolate only' }),
      mkBean({ id: 3, tasting_notes: 'floral only' }),
    ];
    expect(ids(run(beans, { filters: { note: ['chocolate', 'floral'] } }))).toEqual([1]);
  });

  it('q searches name, roaster, origin, varietal, and tasting notes', () => {
    const beans = [
      mkBean({ id: 1, name: 'Yirgacheffe', tasting_notes: '', origin: '', varietal: '' }),
      mkBean({ id: 2, name: '', roaster: { slug: 'r', name: 'Pilot Coffee' }, tasting_notes: '', origin: '', varietal: '' }),
      mkBean({ id: 3, name: '', origin: 'Guatemala Huehuetenango', tasting_notes: '', varietal: '' }),
      mkBean({ id: 4, name: '', varietal: 'SL28', tasting_notes: '', origin: '' }),
      mkBean({ id: 5, name: '', tasting_notes: 'blueberry jam', origin: '', varietal: '' }),
    ];
    expect(ids(run(beans, { filters: { q: 'yirg' } }))).toEqual([1]);
    expect(ids(run(beans, { filters: { q: 'pilot' } }))).toEqual([2]);
    expect(ids(run(beans, { filters: { q: 'huehue' } }))).toEqual([3]);
    expect(ids(run(beans, { filters: { q: 'sl28' } }))).toEqual([4]);
    expect(ids(run(beans, { filters: { q: 'blueberry' } }))).toEqual([5]);
  });

  it('similarSeedId narrows to scored-similar beans and drops the seed itself', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia', varietal: 'Heirloom', process: 'Washed', roast_level: 'Light' }),
      mkBean({ id: 2, country: 'Ethiopia', varietal: 'Heirloom', process: 'Washed', roast_level: 'Light' }),
      mkBean({ id: 3, country: 'Brazil', varietal: 'Catuai', process: 'Natural', roast_level: 'Dark', is_blend: true }),
    ];
    const out = ids(run(beans, { similarSeedId: '1' }));
    expect(out).toContain(2);
    expect(out).not.toContain(1);
  });
});

/* ----------------- filterAndSortBeans: sorting ----------------- */

describe('filterAndSortBeans — sorting', () => {
  it('cpg-asc orders cheapest ¢/g first; cpg-desc reverses', () => {
    const beans = [
      mkBean({ id: 1, name: 'a', variants: [mkVariant({ price_per_gram: 8 })] }),
      mkBean({ id: 2, name: 'b', variants: [mkVariant({ price_per_gram: 5 })] }),
      mkBean({ id: 3, name: 'c', variants: [mkVariant({ price_per_gram: 12 })] }),
    ];
    expect(ids(run(beans, { sort: 'cpg-asc' }))).toEqual([2, 1, 3]);
    expect(ids(run(beans, { sort: 'cpg-desc' }))).toEqual([3, 1, 2]);
  });

  it('name-asc sorts alphabetically', () => {
    const beans = [
      mkBean({ id: 1, name: 'Cccc' }),
      mkBean({ id: 2, name: 'Aaaa' }),
      mkBean({ id: 3, name: 'Bbbb' }),
    ];
    expect(ids(run(beans, { sort: 'name-asc' }))).toEqual([2, 3, 1]);
  });

  it('rating-desc sorts by average rating, missing ratings last', () => {
    const beans = [
      mkBean({ id: 1, rating: { average: 4 } }),
      mkBean({ id: 2, rating: { average: 5 } }),
      mkBean({ id: 3, rating: null }),
    ];
    expect(ids(run(beans, { sort: 'rating-desc' }))).toEqual([2, 1, 3]);
  });

  it('elevation-desc / -asc order by elevation', () => {
    const beans = [
      mkBean({ id: 1, elevation_meters: 1000 }),
      mkBean({ id: 2, elevation_meters: 2000 }),
      mkBean({ id: 3, elevation_meters: 1500 }),
    ];
    expect(ids(run(beans, { sort: 'elevation-desc' }))).toEqual([2, 3, 1]);
    expect(ids(run(beans, { sort: 'elevation-asc' }))).toEqual([1, 3, 2]);
  });

  it('price-asc orders by reference-variant price', () => {
    const beans = [
      mkBean({ id: 1, variants: [mkVariant({ price: 25 })] }),
      mkBean({ id: 2, variants: [mkVariant({ price: 18 })] }),
      mkBean({ id: 3, variants: [mkVariant({ price: 30 })] }),
    ];
    expect(ids(run(beans, { sort: 'price-asc' }))).toEqual([2, 1, 3]);
  });

  it('distance-asc orders by haversine distance from location', () => {
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'far', name: 'Far', latitude: 60, longitude: -123 } }),
      mkBean({ id: 2, roaster: { slug: 'near', name: 'Near', latitude: 49.1, longitude: -123 } }),
    ];
    const location = { lat: 49, lng: -123 };
    expect(ids(run(beans, { sort: 'distance-asc', location }))).toEqual([2, 1]);
  });
});

/* ----------------- buildFilterOptions ----------------- */

describe('buildFilterOptions', () => {
  it('originOptions counts and sorts by frequency desc', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia' }),
      mkBean({ id: 2, country: 'Ethiopia' }),
      mkBean({ id: 3, country: 'Ethiopia' }),
      mkBean({ id: 4, country: 'Colombia' }),
    ];
    const { originOptions } = buildFilterOptions(beans);
    expect(originOptions).toEqual([
      { value: 'Ethiopia', label: 'Ethiopia', count: 3 },
      { value: 'Colombia', label: 'Colombia', count: 1 },
    ]);
  });

  it('noteOptions hides one-offs (count < 2) and title-cases', () => {
    const beans = [
      mkBean({ id: 1, tasting_notes: 'chocolate' }),
      mkBean({ id: 2, tasting_notes: 'chocolate' }),
      mkBean({ id: 3, tasting_notes: 'jasmine' }),
    ];
    const { noteOptions } = buildFilterOptions(beans);
    expect(noteOptions).toEqual([{ value: 'chocolate', label: 'Chocolate', count: 2 }]);
  });

  it('roastOptions are forced into light→medium→dark order', () => {
    const beans = [
      mkBean({ id: 1, roast_level: 'Dark' }),
      mkBean({ id: 2, roast_level: 'Light' }),
      mkBean({ id: 3, roast_level: 'Medium' }),
    ];
    const { roastOptions } = buildFilterOptions(beans);
    expect(roastOptions.map((o) => o.value)).toEqual(['light', 'medium', 'dark']);
  });

  it('elevationOptions always lists all four tiers (incl. empty)', () => {
    const beans = [mkBean({ id: 1, elevation_meters: 1600 })]; // high only
    const { elevationOptions } = buildFilterOptions(beans);
    expect(elevationOptions).toHaveLength(4);
    expect(elevationOptions.find((o) => o.value === 'high').count).toBe(1);
    expect(elevationOptions.find((o) => o.value === 'low').count).toBe(0);
  });

  it('cpgOptions always lists all four tiers', () => {
    const beans = [mkBean({ id: 1, variants: [mkVariant({ price_per_gram: 5 })] })];
    const { cpgOptions } = buildFilterOptions(beans);
    expect(cpgOptions).toHaveLength(4);
    expect(cpgOptions.find((o) => o.value === 'lt6').count).toBe(1);
  });

  it('roasterOptions are alphabetical by label', () => {
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'z', name: 'Zebra' } }),
      mkBean({ id: 2, roaster: { slug: 'a', name: 'Alpha' } }),
    ];
    const { roasterOptions } = buildFilterOptions(beans);
    expect(roasterOptions.map((o) => o.label)).toEqual(['Alpha', 'Zebra']);
  });

  it('ignores out-of-stock beans by default', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia' }),
      mkBean({ id: 2, country: 'Kenya', variants: [mkVariant({ in_stock: false })] }),
    ];
    const { originOptions } = buildFilterOptions(beans, mkFilters(), false);
    expect(originOptions.map((o) => o.value)).toEqual(['Ethiopia']);
  });
});

/* ----------------- buildFilterOptions: cascading (faceted) ----------------- */

describe('buildFilterOptions — cascading', () => {
  it('selecting a roaster narrows origin options to that roaster (the 49th/Ethiopia case)', () => {
    // Roaster A sells Colombia + Kenya; only roaster B sells Ethiopia. With
    // A selected, Ethiopia must NOT be offered in the Region dropdown.
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'a', name: 'A' }, country: 'Colombia' }),
      mkBean({ id: 2, roaster: { slug: 'a', name: 'A' }, country: 'Kenya' }),
      mkBean({ id: 3, roaster: { slug: 'b', name: 'B' }, country: 'Ethiopia' }),
    ];
    const { originOptions } = buildFilterOptions(beans, mkFilters({ roaster: 'a' }), false);
    expect(originOptions.map((o) => o.value)).toEqual(['Colombia', 'Kenya']);
    expect(originOptions.find((o) => o.value === 'Ethiopia')).toBeUndefined();
  });

  it('counts reflect the filtered subset, not the whole catalog', () => {
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'a', name: 'A' }, country: 'Colombia' }),
      mkBean({ id: 2, roaster: { slug: 'a', name: 'A' }, country: 'Colombia' }),
      mkBean({ id: 3, roaster: { slug: 'b', name: 'B' }, country: 'Colombia' }),
    ];
    const { originOptions } = buildFilterOptions(beans, mkFilters({ roaster: 'a' }), false);
    expect(originOptions).toEqual([{ value: 'Colombia', label: 'Colombia', count: 2 }]);
  });

  it('a dimension does not constrain its own options (so you can OR-add siblings)', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia' }),
      mkBean({ id: 2, country: 'Colombia' }),
    ];
    const { originOptions } = buildFilterOptions(beans, mkFilters({ country: ['Ethiopia'] }), false);
    expect(originOptions.map((o) => o.value).sort()).toEqual(['Colombia', 'Ethiopia']);
  });

  it('cross-dimension: selecting a country narrows the process options', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia', process: 'Washed' }),
      mkBean({ id: 2, country: 'Colombia', process: 'Natural' }),
    ];
    const { processOptions } = buildFilterOptions(beans, mkFilters({ country: ['Ethiopia'] }), false);
    expect(processOptions.map((o) => o.value)).toEqual(['washed']);
  });

  it('keeps a selected value listed at count 0 when another filter zeroes it', () => {
    // Roaster A has only Washed; user has also selected process=Natural.
    // Natural must stay in the Process menu (count 0) so it can be unchecked.
    const beans = [
      mkBean({ id: 1, roaster: { slug: 'a', name: 'A' }, process: 'Washed' }),
      mkBean({ id: 2, roaster: { slug: 'b', name: 'B' }, process: 'Natural' }),
    ];
    const { processOptions } = buildFilterOptions(
      beans, mkFilters({ roaster: 'a', process: ['natural'] }), false
    );
    const byVal = Object.fromEntries(processOptions.map((o) => [o.value, o.count]));
    expect(byVal.washed).toBe(1);
    expect(byVal.natural).toBe(0);
  });

  it('keeps a selected roaster listed (with its name) even when zeroed by another filter', () => {
    const beans = [
      mkBean({ id: 1, country: 'Ethiopia', roaster: { slug: 'a', name: 'Alpha' } }),
      mkBean({ id: 2, country: 'Colombia', roaster: { slug: 'b', name: 'Bravo' } }),
    ];
    const { roasterOptions } = buildFilterOptions(
      beans, mkFilters({ country: ['Ethiopia'], roaster: 'b' }), false
    );
    const bravo = roasterOptions.find((o) => o.value === 'b');
    expect(bravo).toBeTruthy();
    expect(bravo.label).toBe('Bravo'); // name recovered from full bean list
    expect(bravo.count).toBe(0);
    expect(roasterOptions.find((o) => o.value === 'a').count).toBe(1);
  });
});

/* ----------------- price helpers ----------------- */

describe('reference-variant price helpers', () => {
  it('referenceVariantFor prefers in-stock variants', () => {
    const bean = mkBean({
      variants: [
        mkVariant({ in_stock: false, bag_weight_grams: 454, price_per_gram: 1 }),
        mkVariant({ in_stock: true, bag_weight_grams: 340, price_per_gram: 9 }),
      ],
    });
    expect(referenceVariantFor(bean).bag_weight_grams).toBe(340);
  });

  it('referenceVariantFor picks the variant closest to 454g, tie→smaller bag', () => {
    const bean = mkBean({
      variants: [
        mkVariant({ bag_weight_grams: 350 }), // |350-454| = 104
        mkVariant({ bag_weight_grams: 558 }), // |558-454| = 104 (tie) → loses
        mkVariant({ bag_weight_grams: 250 }), // |250-454| = 204
      ],
    });
    expect(referenceVariantFor(bean).bag_weight_grams).toBe(350);
  });

  it('cheapestCpg falls back to price/grams when price_per_gram is null', () => {
    const bean = mkBean({ variants: [mkVariant({ price: 20, bag_weight_grams: 400, price_per_gram: null })] });
    expect(cheapestCpg(bean)).toBeCloseTo(0.05);
  });

  it('cheapestPrice returns the reference variant price', () => {
    const bean = mkBean({ variants: [mkVariant({ price: 23 })] });
    expect(cheapestPrice(bean)).toBe(23);
  });
});

/* ----------------- label + string helpers ----------------- */

describe('labelForValue', () => {
  const roasters = [{ slug: 'pilot', name: 'Pilot Coffee' }];
  it('maps each key to a display label', () => {
    expect(labelForValue('roaster', 'pilot', roasters)).toBe('Pilot Coffee');
    expect(labelForValue('blend', 'single-origin', roasters)).toBe('Single Origin');
    expect(labelForValue('blend', 'blend', roasters)).toBe('Blend');
    expect(labelForValue('elevation', 'high', roasters)).toBe('High (1500–1800m)');
    expect(labelForValue('cpg', 'lt6', roasters)).toBe('<6¢/g');
    expect(labelForValue('process', 'washed', roasters)).toBe('Washed');
  });
});

describe('string helpers', () => {
  it('normalize lowercases and trims', () => {
    expect(normalize('  Washed ')).toBe('washed');
    expect(normalize(null)).toBe('');
  });
  it('titleCase caps each word incl. hyphenated halves', () => {
    expect(titleCase('milk chocolate')).toBe('Milk Chocolate');
    expect(titleCase('medium-dark')).toBe('Medium-Dark');
  });
});
