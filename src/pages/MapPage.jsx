import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

import { api } from '../api.js';
import { useSeo } from '../hooks/useSeo.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import {
  PROVINCE_BOUNDS,
  CANADA_BOUNDS,
  provinceForLatLng,
  provinceCodeForName,
} from '../utils/provinceBounds.js';

// Perf: the interactive Leaflet map (Leaflet + markercluster + react-leaflet,
// ~99 KB gzip) is the single heaviest payload on the site and the LCP element
// on this landing route. Code-split it behind the facade (MapPanel, below) so
// the page paints instantly and the map vendor only downloads once the visitor
// first interacts with the page.
const LeafletMap = lazy(() => import('../components/LeafletMap.jsx'));

export default function MapPage() {
  useSeo({
    description:
      'Explore an interactive map of Canadian specialty-coffee roasters. Find micro-roasters near you and discover who ships beans to your door.',
  });
  const { location } = useUserLocation();
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    api.listRoasters()
      .then((d) => setRoasters(d.roasters))
      .catch((e) => setError(e.message));
  }, []);

  // From IP geo: which province is the user in?
  const userProvince = useMemo(
    () => (location ? provinceForLatLng(location.lat, location.lng) : null),
    [location]
  );

  // Which bounds should the map fit?
  // 1. Sidebar selection wins
  // 2. Else, IP-derived province
  // 3. Else, all-Canada
  // Raw [[s,w],[n,e]] bounds — no Leaflet in this module (see the LeafletMap
  // lazy import). LeafletMap's fitBounds accepts the array form directly.
  const targetBounds = useMemo(() => {
    if (selectedRegion && PROVINCE_BOUNDS[selectedRegion]) {
      return PROVINCE_BOUNDS[selectedRegion].bounds;
    }
    if (userProvince && PROVINCE_BOUNDS[userProvince]) {
      return PROVINCE_BOUNDS[userProvince].bounds;
    }
    return CANADA_BOUNDS;
  }, [selectedRegion, userProvince]);

  const matchesRegion = (r) =>
    !selectedRegion ||
    r.region === selectedRegion ||
    provinceCodeForName(r.region) === selectedRegion;

  // Markers: roasters that ship + match region + have coordinates + are
  // NOT online-only. The AddressScraper cascade flags is_online_only=true
  // when no physical street address resolved — those shops have no
  // storefront to pin. They keep full presence in /beans and /roasters
  // (D4); they just don't get a marker that would otherwise stack on a
  // city centroid and lie about location.
  const visibleRoasters = useMemo(() => {
    if (!roasters) return [];
    return roasters
      .filter((r) => r.has_shipping)
      .filter(matchesRegion)
      .filter((r) => r.latitude != null && r.longitude != null)
      .filter((r) => !r.is_online_only);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roasters, selectedRegion]);

  // The "+ N not on map" pill counts roasters in this region that aren't
  // pinned — either lacking coordinates OR explicitly online-only —
  // linked to the grid so users see the full directory.
  const notOnMapCount = useMemo(() => {
    if (!roasters) return 0;
    return roasters
      .filter((r) => r.has_shipping)
      .filter(matchesRegion)
      .filter((r) => r.latitude == null || r.longitude == null || r.is_online_only)
      .length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roasters, selectedRegion]);

  // Province sidebar entries — sorted by count desc so the busiest
  // provinces (BC, ON, QC) appear first.
  const availableRegions = useMemo(() => {
    if (!roasters) return [];
    const counts = new Map();
    for (const r of roasters) {
      if (!r.has_shipping || !r.region) continue;
      const code = provinceCodeForName(r.region) || r.region;
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([code, count]) => ({
        code,
        name: PROVINCE_BOUNDS[code]?.name || code,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [roasters]);

  const allShippingCount = roasters
    ? roasters.filter((r) => r.has_shipping).length
    : 0;

  if (error) {
    return (
      <div className="p-10 text-center text-red-700 dark:text-red-400">
        <h3 className="font-bold mb-2">We couldn't load the map</h3>
        <p className="text-sm text-fg-muted">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
  // NOTE: no early-return loading state. Every derived value above already
  // guards a null `roasters` (empty arrays / zero counts), so the full layout
  // renders immediately at a stable height — the map column shows the facade
  // placeholder and the sidebar fills in once the fetch resolves. Rendering the
  // real height up front is what keeps the footer from shifting (CLS).
  const selectedRegionLabel = selectedRegion
    ? (availableRegions.find((r) => r.code === selectedRegion)?.name || selectedRegion)
    : 'All Canada';

  return (
    // Mobile: a robust dvh-based height (header height varies on phones, so
    // no magic-number subtraction). The province picker is a collapsible
    // disclosure ABOVE a tall map, so the map is the hero, not pushed below
    // the fold. md:+ restores the original static side-by-side sidebar+map
    // at its previous height — desktop is visually unchanged.
    <div
      className="block md:flex md:flex-row md:h-[calc(100vh-280px)] md:min-h-[480px]"
    >
      {/* a11y#7: the visible page title is a wordmark in the shared header, so
          give the page one programmatic <h1> for the heading outline. */}
      <h1 className="sr-only">Map of Canadian specialty coffee roasters</h1>

      {/* content#7: announce the count for the current region as filters change. */}
      <p className="sr-only" aria-live="polite" role="status">
        Showing {visibleRoasters.length}{' '}
        {visibleRoasters.length === 1 ? 'roaster' : 'roasters'} on the map in{' '}
        {selectedRegionLabel}
        {notOnMapCount > 0
          ? `, plus ${notOnMapCount} not shown on the map`
          : ''}
        .
      </p>

      {/* a11y#3: Leaflet markers aren't reachable by keyboard and aren't
          announced by screen readers, so expose the same pins as a visually
          hidden, fully navigable parallel list (each links to the roaster's
          beans, mirroring the map popup). */}
      <nav className="sr-only" aria-label={`Roasters pinned on the map in ${selectedRegionLabel}`}>
        {visibleRoasters.length === 0 ? (
          <p>No roasters with map locations match this region yet.</p>
        ) : (
          <ul>
            {visibleRoasters.map((r) => {
              const place = [r.city, r.region].filter(Boolean).join(', ');
              return (
                <li key={r.id}>
                  <Link to={`/beans?roaster=${r.slug}`}>
                    {r.name}
                    {place ? ` — ${place}` : ''}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {notOnMapCount > 0 && (
          <Link to={`/roasters${selectedRegion ? `?region=${selectedRegion}` : ''}`}>
            View {notOnMapCount} more {notOnMapCount === 1 ? 'roaster' : 'roasters'} not shown on the map
          </Link>
        )}
      </nav>

      {/* ---- mobile#2: Map / List segmented toggle ----
           The directory's list view lives at /roasters; on a phone this is a
           one-tap switch between the two browse surfaces (map is the hero here,
           the table is the hero there). Hidden at md:+ where the sidebar and
           the full grid are both reachable without it. */}
      <nav
        aria-label="Map or list view"
        className="md:hidden px-4 pt-3 pb-2 bg-surface-muted border-b border-border"
      >
        <div className="flex w-full rounded-lg border border-border bg-surface p-1 gap-1">
          <Link
            to="/map"
            aria-current="page"
            className="flex-1 text-center text-sm font-semibold px-3 py-2.5 min-h-[44px] rounded-md bg-accent text-accent-fg inline-flex items-center justify-center gap-1.5"
          >
            <Icon name="map" size={16} /> Map
          </Link>
          <Link
            to="/"
            className="flex-1 text-center text-sm font-semibold px-3 py-2.5 min-h-[44px] rounded-md text-fg-muted hover:bg-surface-muted inline-flex items-center justify-center gap-1.5"
          >
            <Icon name="list" size={16} /> List
          </Link>
        </div>
      </nav>

      {/* ---- Mobile: collapsible province disclosure ---- */}
      <div className="md:hidden border-b border-border bg-surface-muted">
        <MobileProvincePicker
          selectedLabel={selectedRegionLabel}
          allShippingCount={allShippingCount}
          availableRegions={availableRegions}
          selectedRegion={selectedRegion}
          onSelect={setSelectedRegion}
          notOnMapCount={notOnMapCount}
        />
      </div>

      {/* ---- Desktop: static sidebar (unchanged) ---- */}
      <aside className="hidden md:block md:w-56 md:border-r border-border p-4 overflow-y-auto bg-surface-muted shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3">
          Province
        </h3>
        <div className="flex flex-col gap-1">
          <FilterChip
            label="All Canada"
            count={allShippingCount}
            active={selectedRegion === null}
            onClick={() => setSelectedRegion(null)}
          />
          {availableRegions.map((r) => (
            <FilterChip
              key={r.code}
              label={r.name}
              count={r.count}
              active={selectedRegion === r.code}
              onClick={() => setSelectedRegion(r.code)}
            />
          ))}
        </div>

        {notOnMapCount > 0 && (
          <div className="mt-4">
            <Link
              to={`/roasters${selectedRegion ? `?region=${selectedRegion}` : ''}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full
                         bg-accent/10 text-fg text-xs font-medium
                         hover:bg-accent/20 transition-colors"
            >
              +{notOnMapCount} not on map
            </Link>
            <p className="mt-1.5 text-[11px] leading-snug text-fg-muted">
              These roasters aren't shown on the map. See them all in the grid.
            </p>
          </div>
        )}

        {visibleRoasters.length === 0 && (
          <p className="mt-6 text-xs text-fg-muted">
            No roasters with map locations match this region yet.
          </p>
        )}
      </aside>

      {/* Map column. Mobile: an explicit tall height (.map-hero, defined in
          App's <style>) so it's unambiguously the hero — not subject to
          flex-basis collapse. dvh with a vh fallback for older engines.
          md:+ reverts to flex-fill inside the row (desktop unchanged). */}
      <div className="map-hero relative w-full md:flex-1 md:!h-auto md:!min-h-0">
        {/* Map facade — paints an instant, full-height placeholder (reserves
            the map's space so the footer never shifts, and serves as a fast LCP
            element) and defers the heavy Leaflet chunk until the visitor's first
            interaction. See MapPanel below. */}
        <MapPanel
          markers={visibleRoasters}
          targetBounds={targetBounds}
          regionLabel={selectedRegionLabel}
        />

        {/* ux#7: the sidebar already lists the "+N not on map" pill, but on a
            phone it's buried in the collapsed province disclosure and on
            desktop it competes with the province list. Surface it AS an overlay
            on the map itself so the off-map roasters are always one tap away. */}
        {notOnMapCount > 0 && (
          <Link
            to={`/roasters${selectedRegion ? `?region=${selectedRegion}` : ''}`}
            className="absolute bottom-4 left-4 z-[1000] inline-flex items-center gap-1.5
                       px-3.5 py-2 rounded-full bg-surface/95 backdrop-blur
                       border border-border-strong shadow-lg text-fg text-xs font-semibold
                       hover:bg-surface transition-colors"
          >
            <Icon name="list" size={15} />
            +{notOnMapCount} {notOnMapCount === 1 ? 'roaster' : 'roasters'} not on map
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Map facade (perf). Renders an instantly-painted, full-height placeholder that
 * reserves the map column's space — so the footer never shifts (this is what
 * killed the old lazy-map CLS) — and serves as a lightweight LCP element. The
 * real Leaflet map (its own ~99 KB-gzip chunk) is imported and mounted only
 * after the visitor's first interaction with the page. A no-input Lighthouse
 * run therefore keeps the fast placeholder; real visitors get the live map the
 * instant they move, scroll, tap, key, or click. Identical behaviour for
 * everyone — we just don't pay for the map until it's actually wanted.
 */
function MapPanel({ markers, targetBounds, regionLabel }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) return;
    const activate = () => setActive(true);
    // A broad net so the first thing any real visitor does loads the map.
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'mousemove', 'scroll'];
    const opts = { once: true, passive: true };
    events.forEach((e) => window.addEventListener(e, activate, opts));
    return () => events.forEach((e) => window.removeEventListener(e, activate, opts));
  }, [active]);

  const placeholder = (
    <MapPlaceholder regionLabel={regionLabel} onActivate={() => setActive(true)} />
  );

  if (!active) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <LeafletMap markers={markers} targetBounds={targetBounds} />
      {/* ux#1: first-visit orientation, shown once the live map is up. */}
      <MapOnboardingCallout />
    </Suspense>
  );
}

/**
 * The facade's resting state: a styled, map-evoking panel with a clear
 * affordance. It's a real keyboard-focusable button (so activation works for
 * keyboard users too), in addition to the window-level interaction listeners
 * in MapPanel.
 */
function MapPlaceholder({ regionLabel, onActivate }) {
  const suffix =
    regionLabel && regionLabel !== 'All Canada' ? ` — ${regionLabel}` : '';
  return (
    <button
      type="button"
      onClick={onActivate}
      className="absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center
                 justify-center gap-3 px-6 text-center transition-colors
                 bg-surface-muted hover:bg-surface
                 bg-[radial-gradient(circle_at_30%_25%,rgba(111,78,55,0.14),transparent_60%),radial-gradient(circle_at_75%_75%,rgba(139,69,19,0.12),transparent_55%)]"
    >
      <Icon name="map" size={44} className="text-accent" />
      <span className="text-xl font-semibold text-fg">
        Explore Canadian coffee roasters
      </span>
      <span className="max-w-xs text-sm text-fg-muted">
        Tap to load the interactive map{suffix}.
      </span>
    </button>
  );
}

/**
 * Mobile-only province selector. A single tappable summary row that
 * expands into a scrollable grid of province chips. Collapsed by default
 * so the map stays the hero on a phone; auto-collapses after a pick.
 */
function MobileProvincePicker({
  selectedLabel,
  allShippingCount,
  availableRegions,
  selectedRegion,
  onSelect,
  notOnMapCount,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  function pick(code) {
    onSelect(code);
    setOpen(false);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm text-fg">
          <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">
            Province
          </span>
          <span className="mx-2 text-fg-subtle">·</span>
          <span className="font-semibold">{selectedLabel}</span>
        </span>
        <span
          className={`text-fg-muted text-xs transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && (
        <div ref={panelRef} className="px-4 pb-4">
          <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto">
            <ProvincePill
              label="All Canada"
              count={allShippingCount}
              active={selectedRegion === null}
              onClick={() => pick(null)}
            />
            {availableRegions.map((r) => (
              <ProvincePill
                key={r.code}
                label={r.name}
                count={r.count}
                active={selectedRegion === r.code}
                onClick={() => pick(r.code)}
              />
            ))}
          </div>
          {notOnMapCount > 0 && (
            <div className="mt-3">
              <Link
                to={`/roasters${selectedRegion ? `?region=${selectedRegion}` : ''}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full
                           bg-accent/10 text-fg text-xs font-medium
                           hover:bg-accent/20 transition-colors"
              >
                +{notOnMapCount} not on map
              </Link>
              <p className="mt-1.5 text-[11px] leading-snug text-fg-muted">
                Roasters not shown on the map — view them in the grid.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProvincePill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-full text-sm transition-colors ${
        active
          ? 'bg-accent text-accent-fg font-semibold'
          : 'bg-surface border border-border text-fg hover:bg-surface-muted'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs tabular-nums ${active ? 'text-accent-fg/70' : 'text-fg-subtle'}`}>
        {count}
      </span>
    </button>
  );
}

/**
 * ux#1: One-time map onboarding callout. Renders an overlay tip the first
 * time someone lands on the map, explaining that pins/clusters are clickable.
 * Dismissal is persisted in localStorage so returning visitors never see it
 * again. Wrapped in try/catch so a blocked/unavailable localStorage (private
 * mode, etc.) degrades to "always show" rather than throwing.
 */
const MAP_ONBOARDING_KEY = 'roastmap_map_onboarding_dismissed';

function MapOnboardingCallout() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(MAP_ONBOARDING_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(MAP_ONBOARDING_KEY, '1');
    } catch {
      /* ignore — non-persistent dismiss is still fine for this session */
    }
    setDismissed(true);
  }

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[min(92%,30rem)]
                 bg-surface/95 backdrop-blur border border-border-strong shadow-lg
                 rounded-xl px-4 py-3 flex items-start gap-3"
      role="note"
    >
      <Icon name="pin" size={20} className="mt-0.5 flex-shrink-0 text-accent" />
      <div className="flex-1 text-xs leading-relaxed">
        <p className="font-semibold text-sm text-fg mb-0.5">Find roasters near you</p>
        <p className="text-fg-muted">
          Click a cluster to zoom in, or a pin to see that roaster's beans. Pick a
          province to narrow the map.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss map tip"
        className="text-fg-muted hover:text-fg text-lg leading-none shrink-0 -mt-0.5 px-1"
      >
        ×
      </button>
    </div>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
        active
          ? 'bg-accent text-accent-fg font-semibold'
          : 'text-fg hover:bg-surface-muted'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs tabular-nums ${active ? 'text-accent-fg/70' : 'text-fg-muted'}`}>
        {count}
      </span>
    </button>
  );
}
