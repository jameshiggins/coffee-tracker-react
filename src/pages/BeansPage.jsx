import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { flattenBeans, uniqueSorted } from '../utils/beans.js';
import { countryName } from '../utils/countries.js';
import { isCoffeeInStock } from '../utils/stock.js';
import { findSimilarBeans } from '../utils/similarity.js';
import { useShowHistorical } from '../hooks/useShowHistorical.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import { haversineKm } from '../utils/distance.js';
import BeanCard from '../components/BeanCard.jsx';
import FilterDropdown from '../components/FilterDropdown.jsx';
import { splitTastingNotes } from '../utils/flavorColor.js';
import { LABELS, MULTI_KEYS, BOOLEAN_KEYS, parseList, ELEVATION_TIERS, elevationTier, CPG_TIERS, cpgTier } from '../utils/beanFilters.js';

/**
 * Unified bean directory. The single canonical browse surface.
 *
 *  - Flat grid (3 cols desktop / 2 tablet / 1 mobile) of <BeanCard>s
 *  - URL state for filters (?q, ?country, ?process, ?roast, ?varietal,
 *    ?blend, ?note, ?roaster, ?bean for deep-link-to-card)
 *  - Active-filters chip row at top, click x to remove individual filters
 *  - Only ONE card expanded at a time (c3); expanded card spans the full
 *    grid row (L4)
 *  - Click any chip on any card → adds filter to URL → list reflows
 *  - Roaster panel appears at the top when ?roaster=slug is active
 *
 * /c/:id and /roasters/:slug both redirect here:
 *   /c/123       → /beans?bean=123  (auto-expands card 123)
 *   /roasters/x  → /beans?roaster=x  (filters + shows roaster panel)
 */
export default function BeansPage() {
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [params, setParams] = useSearchParams();
  const [showHistorical, setShowHistorical] = useShowHistorical();
  const { location, requestPreciseLocation } = useUserLocation();
  const [expandedId, setExpandedId] = useState(null);
  const [gpsRequested, setGpsRequested] = useState(false);
  // Mobile-only: the filter group is collapsed behind a "Filters" toggle
  // so the page isn't a giant stack of buttons. Always-open at sm:+.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    api.listRoasters().then((d) => setRoasters(d.roasters)).catch((e) => setError(e.message));
  }, []);

  // ?bean=<id> auto-expands a specific card on initial load (used by the
  // /c/:id redirect so old permalinks continue working).
  useEffect(() => {
    const beanId = params.get('bean');
    if (beanId) setExpandedId(Number(beanId));
  }, []); // intentional: only on first mount

  // Default sort is "nearest roaster", so on first load attempt to grab
  // a precise GPS reading. If the user has a saved location already
  // (manual pick or prior IP lookup), we use that and skip the prompt.
  // The browser shows its own permission UI; if denied or unavailable,
  // we silently fall through to the IP location (or no location at all).
  useEffect(() => {
    if (location || gpsRequested) return;
    setGpsRequested(true);
    requestPreciseLocation().catch(() => {});
  }, [location, gpsRequested, requestPreciseLocation]);

  const beans = useMemo(() => roasters ? flattenBeans(roasters) : [], [roasters]);

  // Filters live in the URL so they're shareable + back-button-friendly.
  // Multi-select fields (country/process/roast/varietal/note) come back
  // as arrays parsed from a comma-separated query value. Single-select
  // fields (blend, roaster, q) stay strings.
  const filters = useMemo(() => ({
    q: params.get('q') ?? '',
    country: parseList(params.get('country')),
    process: parseList(params.get('process')),
    roast: parseList(params.get('roast')),
    varietal: parseList(params.get('varietal')),
    note: parseList(params.get('note')),
    elevation: parseList(params.get('elevation')),
    cpg: parseList(params.get('cpg')),
    blend: params.get('blend') ?? '',         // single: '', 'single-origin', 'blend'
    roaster: params.get('roaster') ?? '',     // single: roaster slug
  }), [params]);

  // Default sort: nearest roaster first when we know where the user is,
  // cheapest ¢/g when we don't (since "nearest" doesn't make sense without
  // a reference point).
  const sort = params.get('sort') || (location ? 'distance-asc' : 'cpg-asc');

  // ---- filter pipeline ----
  // Multi-select fields are OR-within-field, AND-across-fields. So
  // country=Ethiopia,Colombia AND process=natural means
  // "Ethiopia OR Colombia, that is natural".
  const visibleBeans = useMemo(() => {
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

    const similarSeedId = params.get('similar_to');
    if (similarSeedId) {
      const seed = beans.find((b) => String(b.id) === similarSeedId);
      if (seed) list = findSimilarBeans(seed, list);
    }

    // Apply sort. Distance-aware when we have a user location; otherwise
    // falls back to cheapest ¢/g (the directory's secondary value prop).
    list = [...list].sort(buildSortFn(sort, location));

    return list;
  }, [beans, filters, showHistorical, params, sort, location]);

  const inStockTotal = useMemo(
    () => beans.filter((b) => !b.is_removed && isCoffeeInStock(b)).length,
    [beans]
  );

  // The roaster the user has filtered to (for the panel at the top)
  const filteredRoaster = useMemo(() => {
    if (!filters.roaster || !roasters) return null;
    return roasters.find((r) => r.slug === filters.roaster) ?? null;
  }, [filters.roaster, roasters]);

  // Filter-bar option lists. Built from the in-stock universe so dropdowns
  // never offer values that have no matching beans. Counts shown in the
  // dropdown so users can see how big a slice they'd get.
  const inStockUniverse = useMemo(
    () => beans.filter((b) => !b.is_removed && (showHistorical || isCoffeeInStock(b))),
    [beans, showHistorical]
  );
  const originOptions = useMemo(() => {
    const counts = {};
    for (const b of inStockUniverse) {
      if (b.country) counts[b.country] = (counts[b.country] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([v, c]) => ({ value: v, label: countryName(v) || v, count: c }))
      .sort((a, b) => b.count - a.count);
  }, [inStockUniverse]);
  const noteOptions = useMemo(() => {
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
  }, [inStockUniverse]);
  const processOptions = useMemo(() => {
    const counts = {};
    for (const b of inStockUniverse) {
      const p = normalize(b.process);
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([v, c]) => ({ value: v, label: titleCase(v), count: c }))
      .sort((a, b) => b.count - a.count);
  }, [inStockUniverse]);
  const roastOptions = useMemo(() => {
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
  }, [inStockUniverse]);
  const varietalOptions = useMemo(() => {
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
  }, [inStockUniverse]);
  // Elevation tiers — count how many in-stock beans fall in each tier so
  // the user sees real availability before picking. Tiers with zero beans
  // are still listed (useful as "no high-altitude in stock right now" UX).
  const elevationOptions = useMemo(() => {
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
  }, [inStockUniverse]);
  // ¢/g tiers — count how many in-stock beans land in each price band,
  // using the same reference-variant ¢/g as the "Cheapest ¢/g" sort so
  // the numbers agree with what the cards show. Empty tiers stay listed.
  const cpgOptions = useMemo(() => {
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
  }, [inStockUniverse]);
  // Roaster picker — single-select (mirrors the ?roaster=slug deep-link
  // the map uses). Alphabetical, not by count: you come here to find a
  // *specific* roaster, so a scannable A→Z list beats a popularity sort.
  const roasterOptions = useMemo(() => {
    const bySlug = {};
    for (const b of inStockUniverse) {
      const r = b.roaster;
      if (!r?.slug) continue;
      if (!bySlug[r.slug]) bySlug[r.slug] = { value: r.slug, label: r.name, count: 0 };
      bySlug[r.slug].count += 1;
    }
    return Object.values(bySlug).sort((a, b) => a.label.localeCompare(b.label));
  }, [inStockUniverse]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    // Accept either a string or an array for the value. Empty values
    // delete the key entirely so the URL stays tidy.
    if (Array.isArray(value)) {
      if (value.length === 0) next.delete(key);
      else next.set(key, value.join(','));
    } else {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('bean'); // changing filters cancels deep-link expansion
    setParams(next, { replace: true });
    setExpandedId(null);
  }

  function clearFilter(key, value = null) {
    const next = new URLSearchParams(params);
    if (value !== null && MULTI_KEYS.has(key)) {
      // Multi-field: remove just one value, keep others.
      const remaining = parseList(next.get(key)).filter((v) => v !== value);
      if (remaining.length === 0) next.delete(key);
      else next.set(key, remaining.join(','));
    } else {
      next.delete(key);
    }
    setParams(next, { replace: true });
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true });
    setExpandedId(null);
  }

  // BeanCard chip-click bridge. Multi-fields TOGGLE the value (add if
  // missing, remove if already there); single-fields REPLACE.
  function onChipClick(filterKey, value) {
    const targetKey = filterKey === 'origin' ? 'country'
      : filterKey === 'roast_level' ? 'roast'
      : filterKey;

    if (MULTI_KEYS.has(targetKey)) {
      const current = filters[targetKey];
      const lower = targetKey === 'note' ? String(value).toLowerCase() : normalize(value);
      const needle = targetKey === 'note' ? lower : lower;
      const hasIt = current.includes(needle);
      const next = hasIt ? current.filter((v) => v !== needle) : [...current, needle];
      setFilter(targetKey, next);
    } else {
      const current = filters[targetKey];
      setFilter(targetKey, current === value ? '' : value);
    }
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700">Failed to load</h2>
        <p className="text-amber-700 mt-2">{error}</p>
      </div>
    );
  }
  if (!roasters) return <div className="p-10 text-center text-amber-800">Loading…</div>;

  // Flatten filters to one chip per active value (multi-select fields
  // produce N chips, one per selected value).
  const activeFilterChips = [];
  for (const [key, value] of Object.entries(filters)) {
    if (MULTI_KEYS.has(key) && Array.isArray(value) && value.length) {
      for (const v of value) activeFilterChips.push({ key, value: v });
    } else if (!MULTI_KEYS.has(key) && value) {
      activeFilterChips.push({ key, value });
    }
  }
  // Count for the mobile "Filters" badge — every active filter except the
  // free-text search (which has its own always-visible box on mobile).
  const activeFilterCount = activeFilterChips.filter((c) => c.key !== 'q').length;

  return (
    <div className="p-4 md:p-6">
      {/* ---------- Roaster panel (when ?roaster filter active) ---------- */}
      {filteredRoaster && <RoasterPanel roaster={filteredRoaster} onClear={() => clearFilter('roaster')} />}

      {/* ---------- Filter bar — Type → Roast → Region → Process → Varietal → Elevation → Price → Note ---------- */}
      {/* Sort is intentionally NOT in this group — it lives in its own
          right-aligned slot below so it reads as a sort, not a filter. */}
      <div className="bg-white rounded-xl border border-amber-100 p-3 mb-4">
       {/* Mobile: a single "Filters" toggle replaces the wall of dropdowns.
           Search stays out here (primary action). sm:+ hides this row and
           shows the full inline filter group below, exactly as before. */}
       <div className="flex items-center gap-2 sm:hidden">
         <button
           type="button"
           onClick={() => setMobileFiltersOpen((v) => !v)}
           aria-expanded={mobileFiltersOpen}
           className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${
             activeFilterCount > 0
               ? 'bg-amber-100 border-amber-300 text-amber-900'
               : 'bg-white border-amber-200 text-amber-700'
           }`}
         >
           <span aria-hidden="true">⚙</span>
           Filters
           {activeFilterCount > 0 && (
             <span className="bg-amber-700 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center">
               {activeFilterCount}
             </span>
           )}
           <span className={`opacity-60 text-xs transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`}>▾</span>
         </button>
         <label htmlFor="beans-search-m" className="sr-only">
           Search beans, roasters, origins, and tasting notes
         </label>
         <input
           id="beans-search-m"
           type="search"
           value={filters.q}
           onChange={(e) => setFilter('q', e.target.value)}
           placeholder="Search…"
           aria-label="Search beans, roasters, origins, and tasting notes"
           className="flex-1 min-w-0 px-3 py-2.5 min-h-[44px] border-2 border-amber-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
         />
       </div>

       <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} sm:flex items-center gap-2 flex-wrap mt-3 sm:mt-0`}>
        <FilterDropdown
          label="Type"
          value={filters.blend}
          options={[
            { value: 'single-origin', label: 'Single Origin' },
            { value: 'blend', label: 'Blend' },
          ]}
          onPick={(v) => setFilter('blend', v)}
        />
        <FilterDropdown
          label="Roaster"
          value={filters.roaster}
          options={roasterOptions}
          onPick={(v) => setFilter('roaster', v)}
        />
        <FilterDropdown
          label="Roast"
          multi
          value={filters.roast}
          options={roastOptions}
          onPick={(v) => setFilter('roast', v)}
        />
        <FilterDropdown
          label="Region"
          multi
          value={filters.country}
          options={originOptions}
          onPick={(v) => setFilter('country', v)}
        />
        <FilterDropdown
          label="Process"
          multi
          value={filters.process}
          options={processOptions}
          onPick={(v) => setFilter('process', v)}
        />
        <FilterDropdown
          label="Varietal"
          multi
          value={filters.varietal}
          options={varietalOptions}
          onPick={(v) => setFilter('varietal', v)}
        />
        <FilterDropdown
          label="Elevation"
          multi
          value={filters.elevation}
          options={elevationOptions}
          onPick={(v) => setFilter('elevation', v)}
        />
        <FilterDropdown
          label="Price ¢/g"
          multi
          value={filters.cpg}
          options={cpgOptions}
          onPick={(v) => setFilter('cpg', v)}
        />
        <FilterDropdown
          label="Tasting note"
          multi
          value={filters.note}
          options={noteOptions}
          onPick={(v) => setFilter('note', v)}
        />
        {/* Desktop search — hidden on mobile (the toggle row has its own). */}
        <label htmlFor="beans-search" className="sr-only">
          Search beans, roasters, origins, and tasting notes
        </label>
        <input
          id="beans-search"
          type="search"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          placeholder="Search beans, roasters…"
          aria-label="Search beans, roasters, origins, and tasting notes"
          className="hidden sm:block flex-1 min-w-[200px] px-3 py-2 border-2 border-amber-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
        />
        <label className="text-sm text-amber-800 cursor-pointer select-none flex items-center gap-1.5 py-2 sm:py-0"
               title="Include sold-out beans and ones the roaster has dropped from their catalog">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={(e) => setShowHistorical(e.target.checked)}
            className="accent-amber-700 w-4 h-4"
          />
          Show historical
        </label>
       </div>

       {/* ---------- Sort — own slot, right-aligned, visually distinct from
            the filter group above so users can find price-per-gram sorting
            at a glance. Divider + "Sort by" label signal it's a sort, not
            a filter; the dropdown button shows the active sort by name. ---------- */}
       <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
         <span className="text-sm text-amber-700 font-semibold flex items-center gap-1.5">
           <span aria-hidden="true">↕</span>
           <span className="sm:hidden">Sort</span>
         </span>
         <FilterDropdown
           label="Sort"
           value={sort}
           options={SORT_OPTIONS}
           onPick={(v) => {
             const next = v || 'cpg-asc';
             setFilter('sort', next);
             // Picking "Nearest" without a known location triggers the
             // browser's GPS prompt. We try once per session — if denied,
             // the sort silently falls through to fixed-position ties.
             if (next === 'distance-asc' && !location && !gpsRequested) {
               setGpsRequested(true);
               requestPreciseLocation().catch(() => {});
             }
           }}
         />
       </div>
      </div>

      {/* ---------- Active filters chip row (u3) ---------- */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
          <span className="text-amber-600 font-medium">Filtering by:</span>
          {activeFilterChips.map(({ key, value }, i) => (
            <button
              key={`${key}-${value}-${i}`}
              onClick={() => clearFilter(key, value)}
              className="inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs"
              title="Click to remove"
            >
              {BOOLEAN_KEYS.has(key) ? (
                <span className="font-medium">{LABELS[key]}</span>
              ) : (
                <>
                  <span className="text-amber-600">{LABELS[key] || key}:</span>
                  <span className="font-medium">{labelForValue(key, value, roasters)}</span>
                </>
              )}
              <span className="ml-1 text-amber-600">✕</span>
            </button>
          ))}
          {params.get('similar_to') && (
            <button
              onClick={() => { const n = new URLSearchParams(params); n.delete('similar_to'); setParams(n, { replace: true }); }}
              className="inline-flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs"
            >
              <span className="text-purple-600">Similar to:</span>
              <span className="font-medium">
                {beans.find((b) => String(b.id) === params.get('similar_to'))?.name || '?'}
              </span>
              <span className="ml-1 text-purple-600">✕</span>
            </button>
          )}
          <button onClick={clearAll} className="text-amber-700 hover:underline text-xs ml-2">
            Clear all
          </button>
        </div>
      )}

      {/* ---------- Result count ---------- */}
      <div className="text-sm text-amber-700 mb-3">
        Showing <strong>{visibleBeans.length}</strong> of {inStockTotal} in-stock beans
      </div>

      {/* ---------- Card grid (L4: grid → row-takeover on expand) ---------- */}
      {visibleBeans.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-100 p-10 text-center text-amber-500">
          Nothing matches. Try removing a filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleBeans.map((bean) => (
            <BeanCard
              key={bean.id}
              coffee={bean}
              isExpanded={expandedId === bean.id}
              onExpandToggle={() => setExpandedId(expandedId === bean.id ? null : bean.id)}
              onChipClick={onChipClick}
              showRoasterChip={!filters.roaster}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------- helpers ----------------- */

// LABELS, MULTI_KEYS, BOOLEAN_KEYS imported from utils/beanFilters.js —
// the single source of truth, guarded by beanFilters.test.js invariants.

// Sort options. "Nearest" is the default when the user has shared a location
// (it triggers a GPS prompt the first time). Falls back to cheapest ¢/g.
const SORT_OPTIONS = [
  { value: 'distance-asc', label: 'Nearest roaster' },
  { value: 'cpg-asc', label: 'Cheapest ¢/g' },
  { value: 'cpg-desc', label: 'Most expensive ¢/g' },
  { value: 'price-asc', label: 'Lowest price' },
  { value: 'rating-desc', label: 'Highest rated' },
  { value: 'name-asc', label: 'Name A→Z' },
];

// parseList is now imported from utils/beanFilters.js

function buildSortFn(sort, location) {
  switch (sort) {
    case 'distance-asc':
      return (a, b) => (distanceFor(a, location) ?? Infinity) - (distanceFor(b, location) ?? Infinity);
    case 'cpg-desc':
      return (a, b) => (cheapestCpg(b) ?? -Infinity) - (cheapestCpg(a) ?? -Infinity);
    case 'price-asc':
      return (a, b) => (cheapestPrice(a) ?? Infinity) - (cheapestPrice(b) ?? Infinity);
    case 'rating-desc':
      return (a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1);
    case 'name-asc':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    case 'cpg-asc':
    default:
      return (a, b) => (cheapestCpg(a) ?? Infinity) - (cheapestCpg(b) ?? Infinity);
  }
}

function distanceFor(bean, location) {
  if (!location || !bean.roaster?.latitude || !bean.roaster?.longitude) return null;
  return haversineKm(
    { lat: location.lat, lng: location.lng },
    { lat: bean.roaster.latitude, lng: bean.roaster.longitude }
  );
}

// Reference-variant ¢/g — the variant closest to 1 lb (454 g). This
// makes the sort fair: a roaster's wholesale 5-lb price (which is often
// dramatically cheaper per-gram than retail) doesn't artificially win.
function referenceVariantFor(b) {
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
function cheapestCpg(b) {
  const v = referenceVariantFor(b);
  if (!v) return null;
  return v.price_per_gram ?? (v.price && v.bag_weight_grams ? v.price / v.bag_weight_grams : null);
}
function cheapestPrice(b) {
  const v = referenceVariantFor(b);
  return v?.price ?? null;
}

function labelForValue(key, value, roasters) {
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

function normalize(s) {
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
function titleCase(s) {
  if (!s) return s;
  return String(s).replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

/* ----------------- RoasterPanel ----------------- */

function RoasterPanel({ roaster, onClear }) {
  const addressParts = [
    roaster.street_address, roaster.city, roaster.region,
    roaster.postal_code, roaster.country_code ? countryName(roaster.country_code) : null,
  ].filter(Boolean);

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-5 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-amber-900">{roaster.name}</h2>
            <button
              onClick={onClear}
              className="text-xs text-amber-600 hover:text-amber-900 underline"
            >
              ← Show all roasters
            </button>
          </div>
          {addressParts.length > 0 && (
            <div className="text-sm text-amber-700 mt-1">📍 {addressParts.join(', ')}</div>
          )}
          {roaster.description && (
            <p className="text-sm text-amber-900 mt-3 leading-relaxed line-clamp-3">{roaster.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {roaster.website && (
            <a
              href={roaster.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-800 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              🌐 Visit roaster's site
            </a>
          )}
        </div>
      </div>
      {(roaster.shipping_cost != null || roaster.free_shipping_over != null || roaster.shipping_notes) && (
        <div className="mt-3 pt-3 border-t border-amber-100 text-xs text-amber-800 flex flex-wrap gap-4">
          {roaster.shipping_cost != null && <span>📦 Shipping: <strong>${Number(roaster.shipping_cost).toFixed(2)}</strong></span>}
          {roaster.free_shipping_over != null && <span>🎁 Free over: <strong>${Number(roaster.free_shipping_over).toFixed(2)}</strong></span>}
          {roaster.shipping_notes && <span className="text-amber-600 italic line-clamp-1 max-w-md">{roaster.shipping_notes}</span>}
        </div>
      )}
    </div>
  );
}
