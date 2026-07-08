// RoastersPage = the directory list and the app's landing route ("/"). The
// roaster list is the product's focus: a prominent search, province/country
// filters, and a stock toggle over modern cards (mobile) / an editorial table
// (desktop). The live Leaflet map is a secondary view at /map.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { formatCAD } from '../utils/format.js';
import { countryName } from '../utils/countries.js';
import { isCoffeeInStock } from '../utils/stock.js';
import { haversineKm, formatKm } from '../utils/distance.js';
import { useShowOutOfStock } from '../hooks/useShowHistorical.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import { useDirectoryFilters } from '../hooks/useDirectoryFilters.js';
import { useSeo } from '../hooks/useSeo.js';
import Skeleton from '../ui/Skeleton.jsx';
import Badge from '../ui/Badge.jsx';
import Icon from '../components/Icon.jsx';

const SORT_FIELDS = ['distance', 'name', 'country', 'region', 'city', 'coffees', 'cpg_range', 'shipping_cost', 'free_shipping_over'];

const ROASTER_SINGLE_KEYS = ['q', 'region', 'country'];
const NO_MULTI_KEYS = new Set();

function priceRange(roaster, { includeOutOfStock }) {
  const coffees = includeOutOfStock
    ? (roaster.coffees || [])
    : (roaster.coffees || []).filter(isCoffeeInStock);
  const cpgs = coffees.flatMap((c) => (c.variants || [])
    .filter((v) => v.bag_weight_grams > 0 && (includeOutOfStock || v.in_stock))
    .map((v) => (v.price / v.bag_weight_grams) * 100));
  if (cpgs.length === 0) return { min: null, max: null };
  return { min: Math.min(...cpgs), max: Math.max(...cpgs) };
}

// Colour the ¢/g signal: green = great value, amber = mid, red = premium.
// Uses text-tuned shades per theme (NOT the semantic status tokens, whose dark
// values are tuned as badge BACKGROUNDS and fall below 4.5:1 as text on the
// dark card). Both light (-700) and dark (-400) variants clear WCAG AA.
function cpgClass(min) {
  if (min == null) return 'text-fg-subtle';
  if (min < 6.5) return 'text-emerald-700 dark:text-emerald-400';
  if (min < 7.5) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
}

function priceLabel(range) {
  if (range.min == null) return '—';
  return range.min === range.max
    ? `${range.min.toFixed(1)}¢/g`
    : `${range.min.toFixed(1)}–${range.max.toFixed(1)}¢/g`;
}

function shipLabel(r) {
  if (r.shipping_cost == null) return null;
  return Number(r.shipping_cost) === 0 ? 'Free ship' : `${formatCAD(r.shipping_cost)} ship`;
}

// Roaster avatar — the scraped favicon, or initials on a soft accent tile.
function RoasterAvatar({ roaster }) {
  const initials = (roaster.name || '?').replace(/[^a-zA-Z ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return (
    <span className="relative inline-flex w-10 h-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-xs font-bold overflow-hidden">
      <span aria-hidden="true">{initials}</span>
      {roaster.favicon_url && (
        <img
          src={roaster.favicon_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain bg-surface"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </span>
  );
}

export default function RoastersPage() {
  useSeo({
    title: 'Roasters',
    description:
      'Browse every Canadian specialty-coffee roaster in the directory. Filter by province, search by name, and compare bean selection, pricing, and shipping.',
  });
  const navigate = useNavigate();
  const [showOutOfStock, setShowOutOfStock] = useShowOutOfStock();
  const { location } = useUserLocation();
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const { filters, setFilter, clearAll } = useDirectoryFilters({
    singleKeys: ROASTER_SINGLE_KEYS,
    multiKeys: NO_MULTI_KEYS,
  });
  const { q: search, region, country } = filters;
  // Default to alphabetical (by name). Detected geolocation does NOT silently
  // re-sort the list — it's surfaced as a one-tap "Sort by distance" suggestion
  // (the chip below) that the visitor opts into.
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState('asc');

  useEffect(() => {
    api.listRoasters()
      .then((d) => setRoasters(d.roasters))
      .catch((e) => setError(e.message));
  }, []);

  const allRegions = useMemo(() => {
    if (!roasters) return [];
    return Array.from(new Set(roasters.map((r) => r.region).filter(Boolean))).sort();
  }, [roasters]);

  const allCountries = useMemo(() => {
    if (!roasters) return [];
    return Array.from(new Set(roasters.map((r) => r.country_code).filter(Boolean))).sort();
  }, [roasters]);

  const totalShipping = useMemo(
    () => (roasters ? roasters.filter((r) => r.has_shipping).length : 0),
    [roasters]
  );

  const rows = useMemo(() => {
    if (!roasters) return [];
    let list = roasters.filter((r) => r.has_shipping);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.region || '').toLowerCase().includes(q) ||
          (r.city || '').toLowerCase().includes(q) ||
          r.coffees.some((c) => c.name.toLowerCase().includes(q) || (c.origin || '').toLowerCase().includes(q))
      );
    }

    if (region) list = list.filter((r) => r.region === region);
    if (country) list = list.filter((r) => r.country_code === country);

    list = list
      .map((r) => {
        const inStockBeans = (r.coffees ?? []).filter(isCoffeeInStock);
        const distanceKm = (location && r.latitude != null && r.longitude != null)
          ? haversineKm(location, { lat: r.latitude, lng: r.longitude })
          : null;
        return {
          ...r,
          _inStockCount: inStockBeans.length,
          _range: priceRange(r, { includeOutOfStock: showOutOfStock }),
          _distanceKm: distanceKm,
        };
      })
      .filter((r) => showOutOfStock || r._inStockCount > 0);

    const mult = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sort) {
        case 'distance': {
          const ax = a._distanceKm ?? Infinity;
          const bx = b._distanceKm ?? Infinity;
          return (ax - bx) * mult;
        }
        case 'country': return countryName(a.country_code).localeCompare(countryName(b.country_code)) * mult;
        case 'region': return (a.region || '').localeCompare(b.region || '') * mult;
        case 'city': return (a.city || '').localeCompare(b.city || '') * mult;
        case 'coffees': return ((a.coffees_count ?? a.coffees.length) - (b.coffees_count ?? b.coffees.length)) * mult;
        case 'cpg_range': return ((a._range.min ?? Infinity) - (b._range.min ?? Infinity)) * mult;
        case 'shipping_cost': return ((a.shipping_cost ?? Infinity) - (b.shipping_cost ?? Infinity)) * mult;
        case 'free_shipping_over': return ((a.free_shipping_over ?? Infinity) - (b.free_shipping_over ?? Infinity)) * mult;
        case 'name':
        default:
          return a.name.localeCompare(b.name) * mult;
      }
    });
    return list;
  }, [roasters, search, region, country, sort, dir, showOutOfStock, location]);

  function toggleSort(field) {
    if (!SORT_FIELDS.includes(field)) return;
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setDir('asc'); }
  }
  const hasFilters = search || region || country;

  const sortOptions = [
    ['name', 'Roaster name'],
    ...(location ? [['distance', 'Distance']] : []),
    ...(allCountries.length > 1 ? [['country', 'Country']] : []),
    ['region', 'State / Province'],
    ['city', 'City'],
    ['coffees', 'Bean selection'],
    ['cpg_range', '¢/g range'],
    ['shipping_cost', 'Shipping'],
    ['free_shipping_over', 'Free over'],
  ];

  const selectClass = 'px-3 py-2.5 min-h-[44px] rounded-lg text-sm bg-surface border border-border text-fg focus:outline-none focus:border-accent';

  if (error) {
    return (
      <div className="p-10 text-center text-danger">
        <h3 className="font-bold mb-2 text-fg">We couldn't load the roasters</h3>
        <p className="text-sm text-fg-muted">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2.5 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Canadian specialty-coffee roasters</h1>
      <p className="sr-only" aria-live="polite" role="status">{rows.length} {rows.length === 1 ? 'roaster' : 'roasters'} match your search</p>

      {/* Search hero — the list's primary entry point (search is the CTA). */}
      <section className="px-4 sm:px-6 pt-5 pb-4 sm:pt-7 sm:pb-5 border-b border-border">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">Find a Canadian roaster</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {roasters ? `${totalShipping} roasters` : 'Loading…'} · live beans, prices &amp; shipping
        </p>

        <div className="mt-3.5 relative">
          <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setFilter('q', e.target.value)}
            aria-label="Search roasters by name, city, or region"
            placeholder="Search roasters, cities, beans…"
            className="w-full pl-11 pr-10 py-3 min-h-[48px] rounded-xl text-base bg-surface-muted border border-border text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:bg-surface transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setFilter('q', '')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-fg-muted hover:text-fg hover:bg-border transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Geolocation as a suggestion, not an auto-sort: one tap orders by
              distance; tap again (or pick a sort) to return to alphabetical.
              ALWAYS rendered (disabled until a location is known) so a
              late-resolving IP location doesn't pop the chip in and shift the
              layout — that pop-in was the page's main CLS contributor. */}
          <button
            type="button"
            disabled={!location}
            onClick={() => {
              if (sort === 'distance') { setSort('name'); setDir('asc'); }
              else { setSort('distance'); setDir('asc'); }
            }}
            aria-pressed={sort === 'distance'}
            title={location ? undefined : 'Set your location in the top bar to sort by distance'}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              sort === 'distance'
                ? 'bg-accent-soft text-accent'
                : 'bg-surface-muted text-fg-muted hover:text-fg hover:bg-border'
            }`}
          >
            <Icon name="pin" size={15} />
            {sort === 'distance' ? 'Nearest first' : 'Sort by distance'}
          </button>
          {allCountries.length > 1 && (
            <select value={country} onChange={(e) => setFilter('country', e.target.value)} aria-label="Filter by country" className={selectClass}>
              <option value="">All countries</option>
              {allCountries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
            </select>
          )}
          {/* Province select — always rendered (options just populate once roaster
              data loads) so it doesn't appear late and shift the row. */}
          <select value={region} onChange={(e) => setFilter('region', e.target.value)} aria-label="Filter by province" className={selectClass}>
            <option value="">All provinces</option>
            {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-fg-muted cursor-pointer select-none min-h-[44px] px-1">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: 'var(--color-accent)' }}
            />
            Include sold out
          </label>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-fg-muted hover:text-fg bg-surface-muted hover:bg-border rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name="x" size={15} /> Clear
            </button>
          )}
        </div>
      </section>

      {!roasters ? (
        <div className="px-3 sm:px-5 py-4 space-y-3" role="status" aria-label="Loading roasters">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface rounded-2xl border border-border p-4">
              <Skeleton className="w-10 h-10" rounded="rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 max-w-[10rem]" />
                <Skeleton className="h-3 max-w-[6rem]" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 px-5 text-fg-muted">
          <h3 className="mb-2 text-fg text-xl font-semibold">No roasters found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="px-3 sm:px-5 py-4">
          {/* Mobile (<md): "Sort by" control + stacked cards. */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <label htmlFor="roaster-sort" className="text-sm text-fg-muted flex-shrink-0">Sort by</label>
              <select
                id="roaster-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg text-sm bg-surface border border-border text-fg focus:outline-none focus:border-accent"
              >
                {sortOptions.map(([field, label]) => <option key={field} value={field}>{label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')}
                aria-label={`Sort ${dir === 'asc' ? 'ascending' : 'descending'}; tap to reverse`}
                className="w-11 h-11 border border-border rounded-lg bg-surface text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors inline-flex items-center justify-center flex-shrink-0"
              >
                <Icon name={dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={18} />
              </button>
            </div>
            <ul className="space-y-3">
              {rows.map((r) => {
                const beanCount = showOutOfStock ? (r.coffees_count ?? r.coffees.length) : r._inStockCount;
                const cityRegion = [r.city, r.region].filter(Boolean).join(', ');
                const ship = shipLabel(r);
                return (
                  <li key={r.id}>
                    <Link
                      to={`/beans?roaster=${r.slug}`}
                      className="block bg-surface rounded-2xl border border-border p-4 hover:border-border-strong active:bg-surface-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RoasterAvatar roaster={r} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-fg truncate">{r.name}</div>
                          {r.is_online_only ? (
                            <Badge tone="info" className="mt-0.5">Online only</Badge>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-fg-muted truncate">
                              <Icon name="pin" size={13} className="flex-shrink-0 text-fg-subtle" />
                              <span className="truncate">{cityRegion || '—'}</span>
                            </div>
                          )}
                        </div>
                        {location && r._distanceKm != null && (
                          <span className="text-xs font-medium text-fg-muted bg-surface-muted px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                            {formatKm(r._distanceKm)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-fg-muted min-w-0">
                          <Icon name="coffee" size={15} className="flex-shrink-0 text-fg-subtle" />
                          <span className="truncate">{beanCount} {beanCount === 1 ? 'bean' : 'beans'}</span>
                        </span>
                        <span className={`font-bold whitespace-nowrap ${cpgClass(r._range.min)}`}>{priceLabel(r._range)}</span>
                        {ship && (
                          <span className="inline-flex items-center gap-1.5 text-fg-muted whitespace-nowrap">
                            <Icon name="truck" size={15} className="flex-shrink-0 text-fg-subtle" />
                            {ship}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop (md:+): editorial sortable table. */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full bg-surface border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    ['name', 'Roaster'],
                    ...(location ? [['distance', 'Distance']] : []),
                    ...(allCountries.length > 1 ? [['country', 'Country']] : []),
                    ['region', 'Province'],
                    ['city', 'City'],
                    ['coffees', 'Beans'],
                    ['cpg_range', '¢/g range'],
                    ['shipping_cost', 'Shipping'],
                    ['free_shipping_over', 'Free over'],
                  ].map(([field, label]) => {
                    const active = sort === field;
                    return (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={`bg-surface-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors hover:text-fg ${active ? 'text-accent' : 'text-fg-muted'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {active && <Icon name={dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={13} />}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}
                      onClick={() => navigate(`/beans?roaster=${r.slug}`)}
                      className="hover:bg-surface-muted border-b border-border last:border-b-0 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <RoasterAvatar roaster={r} />
                        <Link to={`/beans?roaster=${r.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-fg hover:text-accent hover:underline">
                          {r.name}
                        </Link>
                      </div>
                    </td>
                    {location && (
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                        {r._distanceKm != null ? formatKm(r._distanceKm) : <span className="text-fg-subtle">—</span>}
                      </td>
                    )}
                    {allCountries.length > 1 && (
                      <td className="px-4 py-3 text-fg">{countryName(r.country_code)}</td>
                    )}
                    <td className="px-4 py-3 text-fg">{r.region || <span className="text-fg-subtle">—</span>}</td>
                    <td className="px-4 py-3 text-fg">
                      {r.is_online_only
                        ? <Badge tone="info">Online only</Badge>
                        : (r.city || <span className="text-fg-subtle">—</span>)}
                    </td>
                    <td className="px-4 py-3 text-fg whitespace-nowrap">
                      {showOutOfStock
                        ? `${r.coffees_count ?? r.coffees.length} ${(r.coffees_count ?? r.coffees.length) === 1 ? 'bean' : 'beans'}`
                        : `${r._inStockCount} ${r._inStockCount === 1 ? 'bean' : 'beans'}`}
                    </td>
                    <td className={`px-4 py-3 font-bold whitespace-nowrap ${cpgClass(r._range.min)}`}>
                      {priceLabel(r._range)}
                    </td>
                    <td className="px-4 py-3 text-fg whitespace-nowrap">
                      {r.shipping_cost != null ? (Number(r.shipping_cost) === 0 ? 'Free' : formatCAD(r.shipping_cost)) : <span className="text-fg-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3 text-fg whitespace-nowrap">
                      {r.free_shipping_over != null ? formatCAD(r.free_shipping_over) : <span className="text-fg-subtle">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
