// RoastersPage = the previous IndexPage content, now living at /roasters.
// Renamed because /roasters is now the dedicated grid view, while / is
// the new MapPage. Logic is identical to the old IndexPage; only the
// component name and route changed.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { countryName } from '../utils/countries.js';
import { isCoffeeInStock } from '../utils/stock.js';
import { haversineKm, formatKm } from '../utils/distance.js';
import { useShowOutOfStock } from '../hooks/useShowHistorical.js';
import { useUserLocation } from '../hooks/useUserLocation.js';

const SORT_FIELDS = ['distance', 'name', 'country', 'region', 'city', 'coffees', 'cpg_range', 'shipping_cost', 'free_shipping_over'];

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
  const navigate = useNavigate();
  const [showOutOfStock, setShowOutOfStock] = useShowOutOfStock();
  const { location } = useUserLocation();
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  // Region/country can be deep-linked from MapPage's "+ N not on map" pill.
  const [searchParams] = useSearchParams();
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
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

  if (error) {
    return (
      <div className="p-10 text-center text-red-700">
        <h3 className="font-bold mb-2">Failed to load</h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-600 mt-3">Make sure the API is reachable at {import.meta.env.VITE_API_BASE || 'localhost:8000'}.</p>
      </div>
    );
  }
  if (!roasters) return <div className="p-10 text-center text-amber-800">Loading…</div>;

  return (
    <>
      <div className="p-5 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roasters, cities, regions, or coffee names..."
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-amber-800"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {allCountries.length > 1 && (
            <select value={country} onChange={(e) => setCountry(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-800">
              <option value="">All countries</option>
              {allCountries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
            </select>
          )}
          {allRegions.length > 0 && (
            <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-800">
              <option value="">All states/provinces</option>
              {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="accent-amber-700"
            />
            Show sold out
          </label>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setRegion(''); setCountry(''); }}
              className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto m-5">
        {rows.length === 0 ? (
          <div className="text-center py-16 px-5 text-gray-600">
            <h3 className="mb-2 text-amber-800 text-xl font-semibold">No roasters found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="w-full bg-white rounded-xl overflow-hidden shadow border-collapse">
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
                    className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-4 text-left font-semibold cursor-pointer select-none transition-colors"
                  >
                    {label} <span className="ml-1 text-xs">{arrow(field)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const range = r._range;
                const minClass = range.min == null ? 'text-gray-400'
                  : range.min < 6.5 ? 'text-green-600'
                  : range.min < 7.5 ? 'text-yellow-600'
                  : 'text-red-600';
                return (
                  <tr key={r.id}
                      onClick={() => navigate(`/beans?roaster=${r.slug}`)}
                      className="hover:bg-amber-50 border-b border-gray-100 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {r.favicon_url && (
                          <img
                            src={r.favicon_url}
                            alt=""
                            loading="lazy"
                            className="w-6 h-6 rounded-sm flex-shrink-0 object-contain bg-amber-50/50 border border-amber-100/60"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <Link to={`/beans?roaster=${r.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-amber-900 hover:underline">
                          {r.name}
                        </Link>
                      </div>
                    </td>
                    {location && (
                      <td className="px-4 py-3 text-amber-700 whitespace-nowrap">
                        {r._distanceKm != null ? formatKm(r._distanceKm) : <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    {allCountries.length > 1 && (
                      <td className="px-4 py-3 text-amber-900">{countryName(r.country_code)}</td>
                    )}
                    <td className="px-4 py-3 text-amber-900">{r.region || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-amber-900">{r.city || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-amber-900">
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
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-amber-900">
                      {r.shipping_cost != null ? `$${Number(r.shipping_cost).toFixed(2)}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-amber-900">
                      {r.free_shipping_over != null ? `$${Number(r.free_shipping_over).toFixed(2)}` : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
