/**
 * Source-of-truth metadata for the /beans page filter system.
 *
 * Three concerns live here together so they stay in sync:
 *   - ALL_FILTER_KEYS: every URL-query key that can drive the filter
 *   - LABELS:          friendly user-facing names for each key
 *   - MULTI_KEYS:      keys whose value is a comma-separated list (multi-select)
 *   - BOOLEAN_KEYS:    keys whose value is just true/false (toggle chips)
 *
 * Any new filter MUST be registered in ALL_FILTER_KEYS and LABELS, and
 * tagged into MULTI_KEYS or BOOLEAN_KEYS if applicable. The unit test
 * `beanFilters.test.js` enforces these invariants so a missed entry
 * can't ship the raw key into the UI.
 */

export const ALL_FILTER_KEYS = [
  'q',          // free-text search
  'country',    // origin country (multi)
  'process',    // washed/natural/honey/etc. (multi)
  'roast',      // light/medium/dark/etc. (multi)
  'varietal',   // bourbon/caturra/geisha/etc. (multi)
  'note',       // tasting note keyword (multi, AND across selected)
  'elevation',  // tier: low/medium/high/very-high (multi)
  'blend',      // 'single-origin' | 'blend'
  'roaster',    // roaster slug
];

export const LABELS = {
  q: 'Search',
  country: 'Region',
  process: 'Process',
  roast: 'Roast',
  varietal: 'Varietal',
  note: 'Tasting note',
  elevation: 'Elevation',
  blend: 'Type',
  roaster: 'Roaster',
};

export const MULTI_KEYS = new Set(['country', 'process', 'roast', 'varietal', 'note', 'elevation']);

// No boolean toggles right now (Has-tasting-notes was removed). Keeping
// the set + the BOOLEAN_KEYS render path in BeansPage so the next one
// only takes a one-line addition.
export const BOOLEAN_KEYS = new Set();

/**
 * Bucket a metres-elevation into a coarse tier. Tiers chosen to match how
 * specialty coffee is typically marketed: Brazilian flat is sub-1200m,
 * Central American mid-altitude is 1200-1500m, classic specialty is
 * 1500-1800m, and "extra altitude" / Geisha territory starts at 1800m+.
 */
// Labels kept short (no comma-thousands, no space before "m") so they
// don't wrap in the ~220px filter dropdown / active-filter chips.
export const ELEVATION_TIERS = [
  { value: 'low',       label: 'Low (<1200m)',       min: 0,    max: 1200 },
  { value: 'medium',    label: 'Med (1200–1500m)',   min: 1200, max: 1500 },
  { value: 'high',      label: 'High (1500–1800m)',  min: 1500, max: 1800 },
  { value: 'very-high', label: 'Very high (1800m+)', min: 1800, max: 9999 },
];

export function elevationTier(meters) {
  if (meters == null || meters <= 0) return null;
  for (const t of ELEVATION_TIERS) {
    if (meters >= t.min && meters < t.max) return t.value;
  }
  return null;
}

/** Parse a comma-separated multi-value URL param into a clean array. */
export function parseList(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
