// RoastersPage = the dedicated /roasters grid view (roaster directory with
// search, sort, and the show-out-of-stock toggle). The live map lives
// separately at / in MapPage.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { countryName } from '../utils/countries.js';
import { isCoffeeInStock } from '../utils/stock.js';
import { haversineKm, formatKm } from '../utils/distance.js';
import { useShowOutOfStock } from '../hooks/useShowHistorical.js';
import { useUserLocation } from '../hooks/useUserLocation.js';
import { useDirectoryFilters } from '../hooks/useDirectoryFilters.js';
import { useSeo } from '../hooks/useSeo.js';
import Skeleton from '../ui/Skeleton.jsx';
import Badge from '../ui/Badge.jsx';

const SORT_FIELDS = ['distance', 'name', 'country', 'region', 'city', 'coffees', 'cpg_range', 'shipping_cost', 'free_shipping_over'];

// RoastersPage filters are all single-select (free-text search + one region
// + one country). Shared with /beans via useDirectoryFilters so the URL
// encoding, clear semantics, and shareable links are identical. Module-scope
// so the hook's memo identity stays stable across renders.
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
  // Filters live in the URL (shared encoding with /beans). q = free-text
  // search; region/country are also the deep-link keys MapPage's "+N not on
  // map" pill targets, so they round-trip as shareable links and update the
  // selects live if the URL changes.
  const { filters, setFilter, clearAll } = useDirectoryFilters({
    singleKeys: ROASTER_SINGLE_KEYS,
    multiKeys: NO_MULTI_KEYS,
  });
  const { q: search, region, country } = filters;
  const [sort, setSort] = useState(location ? 'distance' : 'name');
  const [dir, setDir] = useState('asc');

  useEffect(() => {
    if (location && sort === 'name' && dir === 'asc') setSort('distance');
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const arrow = (f) => (sort === f ? (dir === 'asc' ? '↑' : '↓') : '↕');
  const hasFilters = search || region || country;

  // Same field set as the desktop table headers, in display order. Drives the
  // mobile "Sort by" control, since the sortable column headers are hidden in
  // the mobile card layout below.
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

  if (error) {
    return (
      <div className="p-10 text-center text-red-700 dark:text-red-400">
        <h3 className="font-bold mb-2">We couldn't load the roasters</h3>
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
  if (!roasters) {
    return (
      <div className="m-3 sm:m-5" role="status" aria-label="Loading roasters">
        <div className="bg-surface rounded-xl shadow border border-border overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
              <Skeleton className="w-6 h-6" rounded="rounded-sm" />
              <Skeleton className="h-4 flex-1 max-w-[12rem]" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="sr-only">Coffee roasters — Canadian specialty</h1>
      <p className="sr-only" aria-live="polite" role="status">{rows.length} {rows.length === 1 ? 'roaster' : 'roasters'} match your search</p>
      <div className="p-4 sm:p-5 bg-surface-muted border-b border-border flex flex-wrap gap-3 sm:gap-4 items-center">
        <div className="flex-1 min-w-[12rem] basis-full sm:basis-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setFilter('q', e.target.value)}
            aria-label="Search roasters by name, city, or region"
            placeholder="Search roasters, cities, regions…"
            className="w-full p-3 border-2 border-border rounded-lg text-base bg-surface text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {allCountries.length > 1 && (
            <select value={country} onChange={(e) => setFilter('country', e.target.value)}
                    className="px-3 py-3 sm:py-2.5 border-2 border-border rounded-lg text-sm bg-surface text-fg focus:outline-none focus:border-accent">
              <option value="">All countries</option>
              {allCountries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
            </select>
          )}
          {allRegions.length > 0 && (
            <select value={region} onChange={(e) => setFilter('region', e.target.value)}
                    className="px-3 py-3 sm:py-2.5 border-2 border-border rounded-lg text-sm bg-surface text-fg focus:outline-none focus:border-accent">
              <option value="">All states/provinces</option>
              {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer select-none py-2 sm:py-0">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="accent-amber-700 dark:accent-amber-500 w-4 h-4"
            />
            Include sold out & discontinued
          </label>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="px-5 py-3 sm:py-2.5 bg-surface-muted hover:bg-border-strong text-fg-muted hover:text-fg border border-border rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="m-3 sm:m-5">
        {rows.length === 0 ? (
          <div className="text-center py-16 px-5 text-fg-muted">
            <h3 className="mb-2 text-fg text-xl font-semibold">No roasters found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
          {/* Mobile (<md): "Sort by" control + stacked cards. The desktop
              table's sortable headers are hidden here, so this drives sort. */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 mb-3">
              <label htmlFor="roaster-sort" className="text-sm text-fg-muted flex-shrink-0">Sort by</label>
              <select
                id="roaster-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 min-h-[44px] border-2 border-border rounded-lg text-sm bg-surface text-fg focus:outline-none focus:border-accent"
              >
                {sortOptions.map(([field, label]) => <option key={field} value={field}>{label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')}
                aria-label={`Sort ${dir === 'asc' ? 'ascending' : 'descending'}; tap to reverse`}
                className="px-3 py-2.5 min-h-[44px] min-w-[44px] border-2 border-border rounded-lg text-base bg-surface text-fg hover:bg-surface-muted transition-colors inline-flex items-center justify-center flex-shrink-0"
              >
                <span aria-hidden="true">{dir === 'asc' ? '↑' : '↓'}</span>
              </button>
            </div>
            <ul className="space-y-3">
              {rows.map((r) => {
                const range = r._range;
                const minClass = range.min == null ? 'text-fg-subtle'
                  : range.min < 6.5 ? 'text-green-600 dark:text-green-400'
                  : range.min < 7.5 ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400';
                const beanCount = showOutOfStock ? (r.coffees_count ?? r.coffees.length) : r._inStockCount;
                const cityRegion = [r.city, r.region].filter(Boolean).join(', ');
                return (
                  <li key={r.id}>
                    <Link
                      to={`/beans?roaster=${r.slug}`}
                      className="block bg-surface rounded-xl shadow border border-border p-4 hover:bg-surface-muted transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {r.favicon_url && (
                          <img
                            src={r.favicon_url}
                            alt=""
                            loading="lazy"
                            className="w-8 h-8 rounded-sm flex-shrink-0 object-contain bg-surface-muted border border-border"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-fg truncate">{r.name}</div>
                          {r.is_online_only ? (
                            <Badge tone="info" className="mt-0.5">Online only</Badge>
                          ) : (
                            <div className="text-sm text-fg-muted truncate">{cityRegion || '—'}</div>
                          )}
                        </div>
                        {location && (
                          <span className="text-xs text-fg-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                            {r._distanceKm != null ? formatKm(r._distanceKm) : '—'}
                          </span>
                        )}
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-fg-subtle">Beans</dt>
                          <dd className="text-fg font-medium">{beanCount} {beanCount === 1 ? 'bean' : 'beans'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-fg-subtle">¢/g range</dt>
                          <dd className={`font-bold ${minClass}`}>
                            {range.min != null
                              ? (range.min === range.max ? `${range.min.toFixed(1)}¢` : `${range.min.toFixed(1)}–${range.max.toFixed(1)}¢`)
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-fg-subtle">Shipping</dt>
                          <dd className="text-fg">{r.shipping_cost != null ? `$${Number(r.shipping_cost).toFixed(2)}` : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-fg-subtle">Free over</dt>
                          <dd className="text-fg">{r.free_shipping_over != null ? `$${Number(r.free_shipping_over).toFixed(2)}` : '—'}</dd>
                        </div>
                      </dl>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Desktop (md:+): full sortable table. */}
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full bg-surface rounded-xl overflow-hidden shadow border-collapse">
            <thead>
              <tr>
                {[
                  ['name', 'Roaster'],
                  ...(location ? [['distance', 'Distance']] : []),
                  ...(allCountries.length > 1 ? [['country', 'Country']] : []),
                  ['region', 'State / Province'],
                  ['city', 'City'],
                  ['coffees', 'Bean selection'],
                  ['cpg_range', '¢/g range'],
                  ['shipping_cost', 'Shipping'],
                  ['free_shipping_over', 'Free over'],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="bg-accent hover:bg-accent-hover text-accent-fg px-4 py-4 text-left font-semibold cursor-pointer select-none transition-colors"
                  >
                    {label} <span className="ml-1 text-xs">{arrow(field)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const range = r._range;
                const minClass = range.min == null ? 'text-fg-subtle'
                  : range.min < 6.5 ? 'text-green-600 dark:text-green-400'
                  : range.min < 7.5 ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400';
                return (
                  <tr key={r.id}
                      onClick={() => navigate(`/beans?roaster=${r.slug}`)}
                      className="hover:bg-surface-muted border-b border-border cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {r.favicon_url && (
                          <img
                            src={r.favicon_url}
                            alt=""
                            loading="lazy"
                            className="w-6 h-6 rounded-sm flex-shrink-0 object-contain bg-surface-muted border border-border"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <Link to={`/beans?roaster=${r.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-fg hover:underline">
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
                    <td className="px-4 py-3 text-fg">
                      {showOutOfStock ? (
                        <>{r.coffees_count ?? r.coffees.length} {(r.coffees_count ?? r.coffees.length) === 1 ? 'bean' : 'beans'}</>
                      ) : (
                        <>{r._inStockCount} {r._inStockCount === 1 ? 'bean' : 'beans'}</>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-bold ${minClass} whitespace-nowrap`}>
                      {range.min != null
                        ? (range.min === range.max
                            ? `${range.min.toFixed(1)}¢`
                            : `${range.min.toFixed(1)}–${range.max.toFixed(1)}¢`)
                        : <span className="text-fg-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3 text-fg">
                      {r.shipping_cost != null ? `$${Number(r.shipping_cost).toFixed(2)}` : <span className="text-fg-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3 text-fg">
                      {r.free_shipping_over != null ? `$${Number(r.free_shipping_over).toFixed(2)}` : <span className="text-fg-subtle">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>
    </>
  );
}
