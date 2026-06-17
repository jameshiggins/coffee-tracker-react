import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { countryName } from '../utils/countries.js';
import { useShowHistorical } from '../hooks/useShowHistorical.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import { useBeans } from '../hooks/useBeans.js';
import { useSeo } from '../hooks/useSeo.js';
import { useDirectoryFilters } from '../hooks/useDirectoryFilters.js';
import FilterDropdown from '../components/FilterDropdown.jsx';
import BeanGrid from '../components/BeanGrid.jsx';
import SavedViews from '../components/SavedViews.jsx';
import Icon from '../components/Icon.jsx';
import { SkeletonBeanCard } from '../ui/Skeleton.jsx';
import Snackbar from '../ui/Snackbar.jsx';
import { LABELS, MULTI_KEYS, BOOLEAN_KEYS, parseList } from '../utils/beanFilters.js';
import {
  filterAndSortBeans,
  buildFilterOptions,
  inStockUniverseOf,
  labelForValue,
  normalize,
  SORT_OPTIONS,
} from '../utils/beanDirectory.js';

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
 * This page is a thin composition shell: data comes from useBeans, URL
 * filter state from useDirectoryFilters, the filter/sort/option logic
 * from utils/beanDirectory (unit-tested), and the list from <BeanGrid>.
 *
 * /c/:id and /roasters/:slug both redirect here:
 *   /c/123       → /beans?bean=123  (auto-expands card 123)
 *   /roasters/x  → /beans?roaster=x  (filters + shows roaster panel)
 */

// Single-select filter keys (string values). Multi-select keys come from
// MULTI_KEYS. Module-scope so useDirectoryFilters' memo identity is stable.
const SINGLE_KEYS = ['q', 'blend', 'roaster'];

export default function BeansPage() {
  useSeo({
    title: 'Beans',
    description:
      'Browse current coffee beans from Canadian specialty roasters. Filter by origin, process, roast, and tasting notes, and compare price per gram.',
  });
  const { roasters, beans, error } = useBeans();
  const [showHistorical, setShowHistorical] = useShowHistorical();
  const { location, requestPreciseLocation } = useUserLocation();
  const [expandedId, setExpandedId] = useState(null);
  const [gpsRequested, setGpsRequested] = useState(false);
  // Mobile-only: the filter group is collapsed behind a "Filters" toggle
  // so the page isn't a giant stack of buttons. Always-open at sm:+.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Mobile-only: a floating "Filters" button that fades in once the inline
  // filter bar has scrolled away (mobile#4).
  const [showFilterFab, setShowFilterFab] = useState(false);
  // Transient action bar shown when a filter is added/removed: it confirms the
  // change (the active-filter chips can be below the fold / behind an open
  // dropdown) AND offers an Undo. See <Snackbar>.
  const [snackbar, setSnackbar] = useState(null);
  const snackbarSeq = useRef(0);

  const { filters, setFilter, clearFilter, clearAll, activeFilterChips, params, setParams } =
    useDirectoryFilters({
      singleKeys: SINGLE_KEYS,
      multiKeys: MULTI_KEYS,
      extraResetKeys: ['bean'], // changing filters cancels deep-link expansion
      onMutate: () => setExpandedId(null),
    });

  // ?bean=<id> auto-expands a specific card on initial load (used by the
  // /c/:id redirect so old permalinks continue working).
  useEffect(() => {
    const beanId = params.get('bean');
    if (beanId) setExpandedId(Number(beanId));
  }, []); // intentional: only on first mount

  // mobile#4: reveal the floating "Filters" button only once the inline filter
  // bar has scrolled out of reach, so it doesn't compete with the bar up top.
  // Fixed positioning (in the markup below) is deliberate — the app shell's
  // overflow-hidden ancestor would neutralise position:sticky here.
  useEffect(() => {
    const onScroll = () => setShowFilterFab(window.scrollY > 360);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // NOTE: we deliberately do NOT auto-request GPS on mount. Firing the
  // browser permission prompt without a user gesture is a poor first
  // impression — and modern browsers penalise gesture-less prompts.
  // Precise location is requested only on an explicit action: picking the
  // "Nearest roaster" sort (below) or the header location chip. Until
  // then we fall back to IP-level location (or none at all).

  // Default sort: nearest roaster first when we know where the user is,
  // cheapest ¢/g when we don't (since "nearest" doesn't make sense without
  // a reference point).
  const sort = params.get('sort') || (location ? 'distance-asc' : 'cpg-asc');

  // The visible, filtered + sorted list. All the logic lives in the
  // unit-tested utils/beanDirectory module.
  const visibleBeans = useMemo(
    () => filterAndSortBeans(beans, {
      filters,
      sort,
      location,
      showHistorical,
      similarSeedId: params.get('similar_to'),
    }),
    [beans, filters, sort, location, showHistorical, params]
  );

  const inStockTotal = useMemo(() => inStockUniverseOf(beans, false).length, [beans]);

  // ----- ux#10: saved views -----
  // The query string a "Save view" captures: the live URL minus the transient
  // ?bean= card-expansion deep link (that's not part of a filter set).
  const currentQuery = useMemo(() => {
    const p = new URLSearchParams(params);
    p.delete('bean');
    return p.toString();
  }, [params]);

  // Re-apply a saved view: blow away the current params and replace with the
  // saved query, then collapse any expanded card (same reset setFilter does).
  const applySavedView = useCallback((query) => {
    setParams(new URLSearchParams(query), { replace: true });
    setExpandedId(null);
  }, [setParams]);

  // How many in-stock beans match a saved view's query *now*. Re-parses the
  // saved query the same way useDirectoryFilters does, then runs the shared
  // pipeline against the current data (always in-stock — restock semantics).
  const countForQuery = useCallback((query) => {
    const p = new URLSearchParams(query);
    const f = {};
    for (const key of SINGLE_KEYS) f[key] = p.get(key) ?? '';
    for (const key of MULTI_KEYS) f[key] = parseList(p.get(key));
    return filterAndSortBeans(beans, {
      filters: f,
      sort: p.get('sort') || 'cpg-asc',
      location,
      showHistorical: false,
      similarSeedId: p.get('similar_to'),
    }).length;
  }, [beans, location]);

  // Saving a pure-sort view is noise; require a real filter (or a similar-to
  // seed) before the save form unlocks.
  const canSaveView = activeFilterChips.length > 0 || !!params.get('similar_to');

  // The roaster the user has filtered to (for the panel at the top)
  const filteredRoaster = useMemo(() => {
    if (!filters.roaster || !roasters) return null;
    return roasters.find((r) => r.slug === filters.roaster) ?? null;
  }, [filters.roaster, roasters]);

  // Filter-bar option lists. CASCADING: each dropdown is derived from the
  // beans matching every OTHER active filter, so the choices (and their
  // counts) reflect the current subset — pick a roaster and Region/Process/
  // etc. collapse to just what that roaster sells. Logic lives in the
  // unit-tested utils/beanDirectory module.
  const {
    originOptions, noteOptions, processOptions, roastOptions,
    varietalOptions, elevationOptions, cpgOptions, roasterOptions,
  } = useMemo(
    () => buildFilterOptions(beans, filters, showHistorical),
    [beans, filters, showHistorical]
  );

  // Show the filter action bar (a Snackbar with an Undo). A fresh sequence id
  // per call re-keys <Snackbar> so a repeat action replays the slide-in and
  // restarts its timer instead of reusing the live one.
  const showSnackbar = useCallback((kind, message, key, before) => {
    snackbarSeq.current += 1;
    setSnackbar({ id: snackbarSeq.current, kind, message, key, before });
  }, []);

  // Apply a filter change immediately, then surface a Snackbar that confirms it
  // and offers an Undo (revert this one key to its previous value). Shared by
  // the filter dropdowns and the in-card chip toggles so every filter action
  // gets the same feedback. Sort and the free-text search box deliberately
  // bypass this and call setFilter directly — neither shows as a filter chip,
  // and an Undo bar on every search keystroke would be noise.
  function applyFilter(key, value) {
    const before = filters[key];
    setFilter(key, value);
    // Undo reverts THIS key to `before`. We stash (key, before) and run the
    // actual setFilter at render time against the LIVE params (see <Snackbar>
    // below) — so Undo can't go stale and only touches this one key, keeping
    // any filters the user added after this action.

    const label = LABELS[key] || key;
    if (MULTI_KEYS.has(key)) {
      const beforeArr = Array.isArray(before) ? before : [];
      const afterArr = Array.isArray(value) ? value : [];
      if (afterArr.length > beforeArr.length) {
        const added = afterArr.find((v) => !beforeArr.includes(v));
        showSnackbar('added', `Added ${label}: ${labelForValue(key, added, roasters)}`, key, before);
      } else if (afterArr.length < beforeArr.length) {
        if (beforeArr.length - afterArr.length === 1) {
          const removed = beforeArr.find((v) => !afterArr.includes(v));
          showSnackbar('removed', `Removed ${label}: ${labelForValue(key, removed, roasters)}`, key, before);
        } else {
          showSnackbar('removed', `Cleared ${label} filter`, key, before);
        }
      }
    } else if (value) {
      showSnackbar('added', `Added ${label}: ${labelForValue(key, value, roasters)}`, key, before);
    } else {
      showSnackbar('removed', `Removed ${label} filter`, key, before);
    }
  }

  // BeanCard chip-click bridge. Multi-fields TOGGLE the value (add if
  // missing, remove if already there); single-fields REPLACE.
  function onChipClick(filterKey, value) {
    const targetKey = filterKey === 'origin' ? 'country'
      : filterKey === 'roast_level' ? 'roast'
      : filterKey;

    if (MULTI_KEYS.has(targetKey)) {
      const current = filters[targetKey];
      const needle = targetKey === 'note' ? String(value).toLowerCase() : normalize(value);
      const hasIt = current.includes(needle);
      const next = hasIt ? current.filter((v) => v !== needle) : [...current, needle];
      applyFilter(targetKey, next);
    } else {
      const current = filters[targetKey];
      applyFilter(targetKey, current === value ? '' : value);
    }
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">We couldn't load the beans</h2>
        <p className="text-fg-muted mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!roasters) {
    return (
      <div className="p-4 md:p-6">
        <div
          role="status"
          aria-label="Loading beans"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBeanCard key={i} />)}
        </div>
      </div>
    );
  }

  // Count for the mobile "Filters" badge — every active filter except the
  // free-text search (which has its own always-visible box on mobile).
  const activeFilterCount = activeFilterChips.filter((c) => c.key !== 'q').length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="sr-only">Coffee beans — Canadian specialty roasters</h1>
      <p className="sr-only" aria-live="polite" role="status">
        {visibleBeans.length} {visibleBeans.length === 1 ? 'bean' : 'beans'} match your filters
      </p>
      {/* ---------- Roaster panel (when ?roaster filter active) ---------- */}
      {filteredRoaster && <RoasterPanel roaster={filteredRoaster} onClear={() => clearFilter('roaster')} />}

      {/* ---------- Filter bar — Type → Roast → Region → Process → Varietal → Elevation → Price → Note ---------- */}
      {/* Sort is intentionally NOT in this group — it lives in its own
          right-aligned slot below so it reads as a sort, not a filter. */}
      <div className="bg-surface rounded-xl border border-border p-3 mb-4">
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
               ? 'bg-surface-muted border-border-strong text-fg'
               : 'bg-surface border-border text-fg-muted'
           }`}
         >
           <span aria-hidden="true">⚙</span>
           Filters
           {activeFilterCount > 0 && (
             <span className="bg-accent text-accent-fg text-xs rounded-full min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center">
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
           className="flex-1 min-w-0 px-3 py-2.5 min-h-[44px] border-2 border-border rounded-lg text-sm bg-surface text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
         />
       </div>

       <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} sm:flex items-center gap-2 flex-wrap mt-3 sm:mt-0`}>
        {/* Tones below intentionally match the chip palette on BeanCard so
            the dropdown for "Region" reads in the same blue as the Origin
            chip the user clicks on a card, "Process" matches the amber
            process chip, etc. Type uses emerald (Single Origin) since
            that's the more common default; cyan would also fit Blend. */}
        <FilterDropdown
          label="Type"
          tone="emerald"
          value={filters.blend}
          options={[
            { value: 'single-origin', label: 'Single Origin' },
            { value: 'blend', label: 'Blend' },
          ]}
          onPick={(v) => applyFilter('blend', v)}
        />
        <FilterDropdown
          label="Roaster"
          value={filters.roaster}
          options={roasterOptions}
          onPick={(v) => applyFilter('roaster', v)}
        />
        <FilterDropdown
          label="Roast"
          tone="rose"
          multi
          value={filters.roast}
          options={roastOptions}
          onPick={(v) => applyFilter('roast', v)}
        />
        <FilterDropdown
          label="Region"
          tone="sky"
          multi
          value={filters.country}
          options={originOptions}
          onPick={(v) => applyFilter('country', v)}
        />
        <FilterDropdown
          label="Process"
          tone="amber"
          multi
          value={filters.process}
          options={processOptions}
          onPick={(v) => applyFilter('process', v)}
        />
        <FilterDropdown
          label="Varietal"
          tone="stone"
          multi
          value={filters.varietal}
          options={varietalOptions}
          onPick={(v) => applyFilter('varietal', v)}
        />
        <FilterDropdown
          label="Elevation"
          tone="violet"
          multi
          value={filters.elevation}
          options={elevationOptions}
          onPick={(v) => applyFilter('elevation', v)}
        />
        <FilterDropdown
          label="Price ¢/g"
          multi
          value={filters.cpg}
          options={cpgOptions}
          onPick={(v) => applyFilter('cpg', v)}
        />
        <FilterDropdown
          label="Tasting note"
          multi
          value={filters.note}
          options={noteOptions}
          onPick={(v) => applyFilter('note', v)}
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
          className="hidden sm:block flex-1 min-w-[200px] px-3 py-2 border-2 border-border rounded-lg text-sm bg-surface text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
        />
        <label className="text-sm text-fg-muted cursor-pointer select-none flex items-center gap-1.5 py-2 sm:py-0"
               title="Include sold-out beans and ones the roaster has dropped from their catalog">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={(e) => setShowHistorical(e.target.checked)}
            className="accent-amber-700 dark:accent-amber-500 w-4 h-4"
          />
          Include sold out & discontinued
        </label>
       </div>

       {/* ---------- Sort — own slot, right-aligned, visually distinct from
            the filter group above so users can find price-per-gram sorting
            at a glance. Divider + "Sort by" label signal it's a sort, not
            a filter; the dropdown button shows the active sort by name. ---------- */}
       <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
         <SavedViews
           currentQuery={currentQuery}
           hasActiveFilters={canSaveView}
           onApply={applySavedView}
           countForQuery={countForQuery}
         />
         <div className="flex items-center gap-2 ml-auto">
           <span className="text-sm text-fg-muted font-semibold flex items-center gap-1.5">
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
      </div>

      {/* ---------- Active filters chip row (u3) ---------- */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
          <span className="text-fg-muted font-medium">Filtering by:</span>
          {activeFilterChips.map(({ key, value }, i) => (
            <button
              key={`${key}-${value}-${i}`}
              onClick={() => clearFilter(key, value)}
              className="inline-flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 text-fg px-3 py-1 rounded-full text-xs transition-colors"
              title="Click to remove"
            >
              {BOOLEAN_KEYS.has(key) ? (
                <span className="font-medium">{LABELS[key]}</span>
              ) : (
                <>
                  <span className="text-fg-muted">{LABELS[key] || key}:</span>
                  <span className="font-medium">{labelForValue(key, value, roasters)}</span>
                </>
              )}
              <span className="ml-1 text-fg-muted">✕</span>
            </button>
          ))}
          {params.get('similar_to') && (
            <button
              onClick={() => { const n = new URLSearchParams(params); n.delete('similar_to'); setParams(n, { replace: true }); }}
              className="inline-flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 dark:text-purple-300 px-3 py-1 rounded-full text-xs transition-colors"
            >
              <span className="text-purple-600 dark:text-purple-400">Similar to:</span>
              <span className="font-medium">
                {beans.find((b) => String(b.id) === params.get('similar_to'))?.name || '?'}
              </span>
              <span className="ml-1 text-purple-600 dark:text-purple-400">✕</span>
            </button>
          )}
          <button onClick={clearAll} className="text-accent hover:underline text-xs ml-2">
            Clear all
          </button>
        </div>
      )}

      {/* ---------- Result count ---------- */}
      <div className="text-sm text-fg-muted mb-3">
        Showing <strong>{visibleBeans.length}</strong> of {inStockTotal} in-stock beans
      </div>

      {/* ---------- Card grid (L4: grid → row-takeover on expand) ---------- */}
      <BeanGrid
        beans={visibleBeans}
        expandedId={expandedId}
        onExpandToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        onChipClick={onChipClick}
        showRoasterChip={!filters.roaster}
        hasActiveFilters={activeFilterChips.length > 0}
        onClearAll={clearAll}
      />

      {/* ---------- mobile#4: floating Filters button (appears on scroll) ---------- */}
      {showFilterFab && (
        <button
          type="button"
          onClick={() => {
            setMobileFiltersOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label={`Show filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          className="sm:hidden fixed right-4 z-30 inline-flex items-center gap-2 px-4 py-3 min-h-[44px]
                     rounded-full bg-accent text-accent-fg font-semibold shadow-lg
                     hover:bg-accent-hover transition-colors"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <span aria-hidden="true">⚙</span>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-accent-fg text-accent text-xs rounded-full min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* ---------- Filter add/remove action bar (confirm + Undo) ---------- */}
      {snackbar && (
        <Snackbar
          key={snackbar.id}
          kind={snackbar.kind}
          message={snackbar.message}
          actionLabel="Undo"
          onAction={() => setFilter(snackbar.key, snackbar.before)}
          onDismiss={() => setSnackbar(null)}
        />
      )}
    </div>
  );
}

/* ----------------- RoasterPanel ----------------- */

function RoasterPanel({ roaster, onClear }) {
  const addressParts = [
    roaster.street_address, roaster.city, roaster.region,
    roaster.postal_code, roaster.country_code ? countryName(roaster.country_code) : null,
  ].filter(Boolean);

  return (
    <div className="bg-surface border border-border-strong rounded-xl p-5 mb-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <nav aria-label="Breadcrumb" className="text-xs text-fg-muted mb-1">
            <Link to="/roasters" className="hover:text-fg underline">Roasters</Link>
            <span aria-hidden="true" className="mx-1.5">›</span>
            <span className="text-fg-subtle">{roaster.name}</span>
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-fg">{roaster.name}</h2>
            <button
              onClick={onClear}
              className="text-xs text-fg-muted hover:text-fg underline"
            >
              ← Show all roasters
            </button>
          </div>
          {addressParts.length > 0 && (
            <div className="text-sm text-fg-muted mt-1 flex items-center gap-1.5">
              <Icon name="pin" size={14} className="flex-shrink-0 text-fg-subtle" />
              <span className="min-w-0 truncate">{addressParts.join(', ')}</span>
            </div>
          )}
          {roaster.description && (
            <p className="text-sm text-fg mt-3 leading-relaxed line-clamp-3">{roaster.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {roaster.website && (
            <a
              href={roaster.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-accent-fg text-xs px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="externalLink" size={14} /> Visit roaster's site
            </a>
          )}
        </div>
      </div>
      {(roaster.shipping_cost != null || roaster.free_shipping_over != null || roaster.shipping_notes) && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-fg-muted flex flex-wrap gap-4">
          {roaster.shipping_cost != null && <span className="inline-flex items-center gap-1.5"><Icon name="truck" size={14} className="text-fg-subtle" /> Shipping: <strong className="text-fg">${Number(roaster.shipping_cost).toFixed(2)}</strong></span>}
          {roaster.free_shipping_over != null && <span className="inline-flex items-center gap-1.5"><Icon name="tag" size={14} className="text-fg-subtle" /> Free over: <strong className="text-fg">${Number(roaster.free_shipping_over).toFixed(2)}</strong></span>}
          {roaster.shipping_notes && <span className="text-fg-subtle italic line-clamp-1 max-w-md">{roaster.shipping_notes}</span>}
        </div>
      )}
    </div>
  );
}
