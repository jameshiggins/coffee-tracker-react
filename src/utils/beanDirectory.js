/**
 * Pure filter / sort / option-building logic for the bean directory.
 *
 * Extracted verbatim from BeansPage so the page becomes a thin
 * presentational shell and this — the riskiest logic — gets unit-test
 * coverage (beanDirectory.test.js). No React, no DOM, no URL parsing
 * here: callers pass already-parsed `filters` (arrays for multi-keys,
 * strings for single-keys) and get back plain arrays.
 *
 *   filterAndSortBeans(beans, { filters, sort, location, showHistorical, similarSeedId })
 *     → the visible, sorted bean list
 *   buildFilterOptions(inStockUniverse)
 *     → { originOptions, noteOptions, processOptions, roastOptions,
 *         varietalOptions, elevationOptions, cpgOptions, roasterOptions }
 */
import { countryName } from './countries.js';
import { isCoffeeInStock } from './stock.js';
import { findSimilarBeans } from './similarity.js';
import { haversineKm } from './distance.js';
import { splitTastingNotes } from './flavorColor.js';
import { ELEVATION_TIERS, elevationTier, CPG_TIERS, cpgTier } from './beanFilters.js';

// Sort options. "Nearest" is the default when the user has shared a location
// (it triggers a GPS prompt the first time). Falls back to cheapest ¢/g.
export const SORT_OPTIONS = [
  { value: 'distance-asc', label: 'Nearest roaster' },
  { value: 'cpg-asc', label: 'Cheapest per gram' },
  { value: 'cpg-desc', label: 'Most expensive per gram' },
  { value: 'price-asc', label: 'Lowest price' },
  { value: 'rating-desc', label: 'Highest rated' },
  { value: 'elevation-desc', label: 'Elevation: highest first' },
  { value: 'elevation-asc', label: 'Elevation: lowest first' },
  { value: 'name-asc', label: 'Name A→Z' },
];

/**
 * The in-stock universe: not soft-removed, and either in stock or
 * showHistorical is on. The source set both the filter pipeline's
 * default visibility and every dropdown's option list derive from.
 */
export function inStockUniverseOf(beans, showHistorical) {
  return beans.filter((b) => !b.is_removed && (showHistorical || isCoffeeInStock(b)));
}

// ---- filter pipeline ----
// Multi-select fields are OR-within-field, AND-across-fields. So
// country=Ethiopia,Colombia AND process=natural means
// "Ethiopia OR Colombia, that is natural".
export function filterAndSortBeans(beans, { filters, sort, location, showHistorical, similarSeedId } = {}) {
  let list = beans;

  // Default: show only currently-buyable. Historical = soft-removed
  // ("no longer sold") OR currently sold-out across all variants.
  if (!showHistorical) list = list.filter((b) => !b.is_removed && isCoffeeInStock(b));

  if (filters.roaster) {
    list = list.filter((b) => b.roaster?.slug === filters.roaster);
  }
  if (filters.country.length) {
    list = list.filter((b) => filters.country.includes(b.country));
  }
  if (filters.process.length) {
    list = list.filter((b) => filters.process.includes(normalize(b.process)));
  }
  if (filters.roast.length) {
    list = list.filter((b) => filters.roast.includes(normalize(b.roast_level)));
  }
  if (filters.varietal.length) {
    list = list.filter((b) => filters.varietal.includes(normalize(b.varietal)));
  }
  if (filters.elevation.length) {
    list = list.filter((b) => {
      const tier = elevationTier(b.elevation_meters);
      return tier !== null && filters.elevation.includes(tier);
    });
  }
  if (filters.cpg.length) {
    // Reuse cheapestCpg (reference-variant ¢/g) so this agrees with the
    // "Cheapest ¢/g" sort and the card prices. Beans with no priceable
    // variant (null ¢/g) drop out while the filter is active.
    list = list.filter((b) => {
      const tier = cpgTier(cheapestCpg(b));
      return tier !== null && filters.cpg.includes(tier);
    });
  }
  if (filters.blend === 'single-origin') list = list.filter((b) => !b.is_blend);
  if (filters.blend === 'blend')         list = list.filter((b) =>  b.is_blend);

  if (filters.note.length) {
    // AND across selected notes (substring match within each). Selecting
    // chocolate + floral means "must have both chocolate AND floral" —
    // this is a precision tool, not a recall tool. Substring is fine
    // because "chocolate" rightly matches "dark chocolate" too.
    const needles = filters.note.map((n) => n.toLowerCase());
    list = list.filter((b) => {
      const hay = (b.tasting_notes || '').toLowerCase();
      return needles.every((n) => hay.includes(n));
    });
  }

  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((b) =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.roaster?.name || '').toLowerCase().includes(q) ||
      (b.origin || '').toLowerCase().includes(q) ||
      (b.varietal || '').toLowerCase().includes(q) ||
      (b.tasting_notes || '').toLowerCase().includes(q)
    );
  }

  if (similarSeedId) {
    const seed = beans.find((b) => String(b.id) === String(similarSeedId));
    if (seed) list = findSimilarBeans(seed, list);
  }

  // Apply sort. Distance-aware when we have a user location; otherwise
  // falls back to cheapest ¢/g (the directory's secondary value prop).
  list = [...list].sort(buildSortFn(sort, location));

  return list;
}

/**
 * Build every filter dropdown's option list from the in-stock universe so
 * dropdowns never offer values that have no matching beans. Counts are
 * shown in the dropdown so users can see how big a slice they'd get.
 */
export function buildFilterOptions(inStockUniverse) {
  return {
    originOptions: buildOriginOptions(inStockUniverse),
    noteOptions: buildNoteOptions(inStockUniverse),
    processOptions: buildProcessOptions(inStockUniverse),
    roastOptions: buildRoastOptions(inStockUniverse),
    varietalOptions: buildVarietalOptions(inStockUniverse),
    elevationOptions: buildElevationOptions(inStockUniverse),
    cpgOptions: buildCpgOptions(inStockUniverse),
    roasterOptions: buildRoasterOptions(inStockUniverse),
  };
}

function buildOriginOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    if (b.country) counts[b.country] = (counts[b.country] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([v, c]) => ({ value: v, label: countryName(v) || v, count: c }))
    .sort((a, b) => b.count - a.count);
}

function buildNoteOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    for (const n of splitTastingNotes(b.tasting_notes)) {
      const key = n.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)  // hide one-offs to keep the list usable
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}

function buildProcessOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    const p = normalize(b.process);
    if (p) counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count);
}

function buildRoastOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    const r = normalize(b.roast_level);
    if (r) counts[r] = (counts[r] || 0) + 1;
  }
  // Force the natural light → medium → dark order rather than count order.
  const order = ['light', 'medium', 'medium-dark', 'dark', 'omni'];
  return order
    .filter((r) => counts[r])
    .map((r) => ({ value: r, label: titleCase(r), count: counts[r] }));
}

function buildVarietalOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    const v = normalize(b.varietal);
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}

// Elevation tiers — count how many in-stock beans fall in each tier so
// the user sees real availability before picking. Tiers with zero beans
// are still listed (useful as "no high-altitude in stock right now" UX).
function buildElevationOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    const t = elevationTier(b.elevation_meters);
    if (t) counts[t] = (counts[t] || 0) + 1;
  }
  return ELEVATION_TIERS.map((tier) => ({
    value: tier.value,
    label: tier.label,
    count: counts[tier.value] || 0,
  }));
}

// ¢/g tiers — count how many in-stock beans land in each price band,
// using the same reference-variant ¢/g as the "Cheapest ¢/g" sort so
// the numbers agree with what the cards show. Empty tiers stay listed.
function buildCpgOptions(inStockUniverse) {
  const counts = {};
  for (const b of inStockUniverse) {
    const t = cpgTier(cheapestCpg(b));
    if (t) counts[t] = (counts[t] || 0) + 1;
  }
  return CPG_TIERS.map((tier) => ({
    value: tier.value,
    label: tier.label,
    count: counts[tier.value] || 0,
  }));
}

// Roaster picker — single-select (mirrors the ?roaster=slug deep-link
// the map uses). Alphabetical, not by count: you come here to find a
// *specific* roaster, so a scannable A→Z list beats a popularity sort.
function buildRoasterOptions(inStockUniverse) {
  const bySlug = {};
  for (const b of inStockUniverse) {
    const r = b.roaster;
    if (!r?.slug) continue;
    if (!bySlug[r.slug]) bySlug[r.slug] = { value: r.slug, label: r.name, count: 0 };
    bySlug[r.slug].count += 1;
  }
  return Object.values(bySlug).sort((a, b) => a.label.localeCompare(b.label));
}

/* ----------------- sort + price helpers ----------------- */

export function buildSortFn(sort, location) {
  switch (sort) {
    case 'distance-asc':
      return (a, b) => (distanceFor(a, location) ?? Infinity) - (distanceFor(b, location) ?? Infinity);
    case 'cpg-desc':
      return (a, b) => (cheapestCpg(b) ?? -Infinity) - (cheapestCpg(a) ?? -Infinity);
    case 'price-asc':
      return (a, b) => (cheapestPrice(a) ?? Infinity) - (cheapestPrice(b) ?? Infinity);
    case 'rating-desc':
      return (a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1);
    case 'elevation-desc':
      // Beans without elevation sink to the bottom either way.
      return (a, b) => (b.elevation_meters ?? -Infinity) - (a.elevation_meters ?? -Infinity);
    case 'elevation-asc':
      return (a, b) => (a.elevation_meters ?? Infinity) - (b.elevation_meters ?? Infinity);
    case 'name-asc':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    case 'cpg-asc':
    default:
      return (a, b) => (cheapestCpg(a) ?? Infinity) - (cheapestCpg(b) ?? Infinity);
  }
}

export function distanceFor(bean, location) {
  if (!location || !bean.roaster?.latitude || !bean.roaster?.longitude) return null;
  return haversineKm(
    { lat: location.lat, lng: location.lng },
    { lat: bean.roaster.latitude, lng: bean.roaster.longitude }
  );
}

// Reference-variant ¢/g — the variant closest to 1 lb (454 g). This
// makes the sort fair: a roaster's wholesale 5-lb price (which is often
// dramatically cheaper per-gram than retail) doesn't artificially win.
export function referenceVariantFor(b) {
  const inStock = (b.variants || []).filter((v) => v.in_stock);
  const pool = inStock.length ? inStock : (b.variants || []);
  return pool.reduce((best, v) => {
    if (best == null) return v;
    const dB = Math.abs(best.bag_weight_grams - 454);
    const dV = Math.abs(v.bag_weight_grams - 454);
    if (dV < dB) return v;
    if (dV === dB && v.bag_weight_grams < best.bag_weight_grams) return v;
    return best;
  }, null);
}

export function cheapestCpg(b) {
  const v = referenceVariantFor(b);
  if (!v) return null;
  return v.price_per_gram ?? (v.price && v.bag_weight_grams ? v.price / v.bag_weight_grams : null);
}

export function cheapestPrice(b) {
  const v = referenceVariantFor(b);
  return v?.price ?? null;
}

export function labelForValue(key, value, roasters) {
  if (key === 'country') return countryName(value) || value;
  if (key === 'roaster') return roasters?.find((r) => r.slug === value)?.name || value;
  if (key === 'blend') return value === 'single-origin' ? 'Single Origin' : 'Blend';
  if (key === 'elevation') {
    return ELEVATION_TIERS.find((t) => t.value === value)?.label || value;
  }
  if (key === 'cpg') {
    return CPG_TIERS.find((t) => t.value === value)?.label || value;
  }
  // Process / Roast / Varietal / Tasting note — stored lowercase, displayed
  // title-case to match the dropdown rendering.
  return titleCase(value);
}

export function normalize(s) {
  return (s || '').toString().toLowerCase().trim();
}

/**
 * Title-case a normalized lowercase value for display in dropdowns and
 * active-filter chips. Stored values stay lowercase (so filtering / URL
 * matching is case-insensitive); we just prettify on the way out.
 *
 *   "washed"           → "Washed"
 *   "yellow bourbon"   → "Yellow Bourbon"
 *   "milk chocolate"   → "Milk Chocolate"
 *   "medium-dark"      → "Medium-Dark"   (hyphenated halves both capped)
 */
export function titleCase(s) {
  if (!s) return s;
  return String(s).replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}
