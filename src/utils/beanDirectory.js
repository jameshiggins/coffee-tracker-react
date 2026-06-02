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

// A fully-empty filter set, used as the default when no filters are active
// (so callers like buildFilterOptions can be invoked with just `beans`).
const EMPTY_FILTERS = {
  q: '', country: [], process: [], roast: [], varietal: [],
  note: [], elevation: [], cpg: [], blend: '', roaster: '',
};

const NO_EXCEPT = new Set();

// ---- structured-filter predicates ----
// The OR-within-field, AND-across-fields core, shared by the visible-list
// pipeline AND the option cascade so the two can never drift. `except` names
// one dimension to SKIP — buildFilterOptions uses it to compute a dropdown's
// availability against every *other* active filter (faceted-search rule), so
// each option reflects how many beans you'd get if you added it.
//
// Free-text `q` and the similar-to seed are deliberately NOT applied here:
// q is orthogonal full-text (re-deriving every dropdown per keystroke is
// jumpy), and similar-mode is a separate browse surface. filterAndSortBeans
// layers those on after.
function applyStructuredFilters(beans, filters, { showHistorical, except = NO_EXCEPT } = {}) {
  let list = beans;

  // Default: show only currently-buyable. Historical = soft-removed
  // ("no longer sold") OR currently sold-out across all variants.
  if (!showHistorical) list = list.filter((b) => !b.is_removed && isCoffeeInStock(b));

  if (!except.has('roaster') && filters.roaster) {
    list = list.filter((b) => b.roaster?.slug === filters.roaster);
  }
  if (!except.has('country') && filters.country.length) {
    list = list.filter((b) => filters.country.includes(b.country));
  }
  if (!except.has('process') && filters.process.length) {
    list = list.filter((b) => filters.process.includes(normalize(b.process)));
  }
  if (!except.has('roast') && filters.roast.length) {
    list = list.filter((b) => filters.roast.includes(normalize(b.roast_level)));
  }
  if (!except.has('varietal') && filters.varietal.length) {
    list = list.filter((b) => filters.varietal.includes(normalize(b.varietal)));
  }
  if (!except.has('elevation') && filters.elevation.length) {
    list = list.filter((b) => {
      const tier = elevationTier(b.elevation_meters);
      return tier !== null && filters.elevation.includes(tier);
    });
  }
  if (!except.has('cpg') && filters.cpg.length) {
    // Reuse cheapestCpg (reference-variant ¢/g) so this agrees with the
    // "Cheapest ¢/g" sort and the card prices. Beans with no priceable
    // variant (null ¢/g) drop out while the filter is active.
    list = list.filter((b) => {
      const tier = cpgTier(cheapestCpg(b));
      return tier !== null && filters.cpg.includes(tier);
    });
  }
  if (!except.has('blend')) {
    if (filters.blend === 'single-origin') list = list.filter((b) => !b.is_blend);
    else if (filters.blend === 'blend')    list = list.filter((b) =>  b.is_blend);
  }
  if (!except.has('note') && filters.note.length) {
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

  return list;
}

// ---- filter pipeline ----
// Multi-select fields are OR-within-field, AND-across-fields. So
// country=Ethiopia,Colombia AND process=natural means
// "Ethiopia OR Colombia, that is natural".
export function filterAndSortBeans(beans, { filters, sort, location, showHistorical, similarSeedId } = {}) {
  let list = applyStructuredFilters(beans, filters, { showHistorical });

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
 * Build every filter dropdown's option list. CASCADING (faceted search):
 * each dropdown's options are derived from the beans that match every OTHER
 * active filter — so picking a roaster narrows Region/Process/Roast/etc. to
 * just what that roaster sells, and the counts show how big a slice each
 * choice would yield. A dimension never constrains its own option list
 * (multi-selects are OR-within-field, so you must still be able to add a
 * sibling value), and any value you've already selected is kept in its menu
 * even if other filters squeezed its count to 0 — so a checked box never
 * silently disappears and you can always uncheck it.
 *
 *   beans          – the full flattened bean list (unfiltered)
 *   filters        – current filter state (arrays for multi, strings for single)
 *   showHistorical – include sold-out / discontinued in the universe
 */
export function buildFilterOptions(beans, filters = EMPTY_FILTERS, showHistorical = false) {
  // Subset matching all active filters EXCEPT the named dimension.
  const subsetFor = (key) =>
    applyStructuredFilters(beans, filters, { showHistorical, except: new Set([key]) });

  return {
    originOptions:    buildOriginOptions(subsetFor('country'), filters.country),
    noteOptions:      buildNoteOptions(subsetFor('note'), filters.note),
    processOptions:   buildProcessOptions(subsetFor('process'), filters.process),
    roastOptions:     buildRoastOptions(subsetFor('roast'), filters.roast),
    varietalOptions:  buildVarietalOptions(subsetFor('varietal'), filters.varietal),
    elevationOptions: buildElevationOptions(subsetFor('elevation')),
    cpgOptions:       buildCpgOptions(subsetFor('cpg')),
    roasterOptions:   buildRoasterOptions(subsetFor('roaster'), filters.roaster, beans),
  };
}

/**
 * Re-append any currently-selected values that the cascade filtered out of
 * `list`, so a checked option stays visible (and uncheckable) in its own
 * dropdown. `make` builds the option object for a kept value, given its real
 * count in the current subset (0 if the value matches nothing right now).
 */
function appendKept(list, keep, counts, make) {
  if (!keep || !keep.length) return list;
  const have = new Set(list.map((o) => o.value));
  const extra = keep.filter((v) => !have.has(v)).map((v) => make(v, counts[v] || 0));
  return [...list, ...extra];
}

function buildOriginOptions(subset, keep = []) {
  const counts = {};
  for (const b of subset) {
    if (b.country) counts[b.country] = (counts[b.country] || 0) + 1;
  }
  const list = Object.entries(counts)
    .map(([v, c]) => ({ value: v, label: countryName(v) || v, count: c }))
    .sort((a, b) => b.count - a.count);
  return appendKept(list, keep, counts, (v, c) => ({ value: v, label: countryName(v) || v, count: c }));
}

function buildNoteOptions(subset, keep = []) {
  const counts = {};
  for (const b of subset) {
    for (const n of splitTastingNotes(b.tasting_notes)) {
      const key = n.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const list = Object.entries(counts)
    .filter(([, c]) => c >= 2)  // hide one-offs to keep the list usable
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
  return appendKept(list, keep, counts, (v, c) => ({ value: v, label: titleCase(v), count: c }));
}

function buildProcessOptions(subset, keep = []) {
  const counts = {};
  for (const b of subset) {
    const p = normalize(b.process);
    if (p) counts[p] = (counts[p] || 0) + 1;
  }
  const list = Object.entries(counts)
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count);
  return appendKept(list, keep, counts, (v, c) => ({ value: v, label: titleCase(v), count: c }));
}

function buildRoastOptions(subset, keep = []) {
  const counts = {};
  for (const b of subset) {
    const r = normalize(b.roast_level);
    if (r) counts[r] = (counts[r] || 0) + 1;
  }
  // Force the natural light → medium → dark order rather than count order.
  // Keep a selected roast listed even at count 0 so it stays uncheckable.
  const order = ['light', 'medium', 'medium-dark', 'dark', 'omni'];
  return order
    .filter((r) => counts[r] || keep.includes(r))
    .map((r) => ({ value: r, label: titleCase(r), count: counts[r] || 0 }));
}

function buildVarietalOptions(subset, keep = []) {
  const counts = {};
  for (const b of subset) {
    const v = normalize(b.varietal);
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  const list = Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
  return appendKept(list, keep, counts, (v, c) => ({ value: v, label: titleCase(v), count: c }));
}

// Elevation tiers — count how many beans in the current subset fall in each
// tier so the user sees real availability before picking. Tiers with zero
// beans are still listed (the fixed ladder reads better whole, and "no
// high-altitude right now" is itself useful UX).
function buildElevationOptions(subset) {
  const counts = {};
  for (const b of subset) {
    const t = elevationTier(b.elevation_meters);
    if (t) counts[t] = (counts[t] || 0) + 1;
  }
  return ELEVATION_TIERS.map((tier) => ({
    value: tier.value,
    label: tier.label,
    count: counts[tier.value] || 0,
  }));
}

// ¢/g tiers — count how many beans in the current subset land in each price
// band, using the same reference-variant ¢/g as the "Cheapest ¢/g" sort so
// the numbers agree with what the cards show. Empty tiers stay listed.
function buildCpgOptions(subset) {
  const counts = {};
  for (const b of subset) {
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
// A selected roaster is kept listed even if other filters zero it out, so
// the dropdown button can still show its name (label recovered from the
// full bean list since it may be absent from the filtered subset).
function buildRoasterOptions(subset, keepSlug = '', allBeans = []) {
  const bySlug = {};
  for (const b of subset) {
    const r = b.roaster;
    if (!r?.slug) continue;
    if (!bySlug[r.slug]) bySlug[r.slug] = { value: r.slug, label: r.name, count: 0 };
    bySlug[r.slug].count += 1;
  }
  if (keepSlug && !bySlug[keepSlug]) {
    const r = allBeans.find((b) => b.roaster?.slug === keepSlug)?.roaster;
    if (r) bySlug[keepSlug] = { value: r.slug, label: r.name, count: 0 };
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
