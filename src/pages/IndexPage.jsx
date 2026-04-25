import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { countryName } from '../utils/countries.js';

const SORT_FIELDS = ['name', 'country', 'region', 'city', 'coffees', 'min_cpg', 'max_cpg'];

function priceRange(roaster) {
  const cpgs = (roaster.coffees || []).flatMap((c) => (c.variants || [])
    .filter((v) => v.bag_weight_grams > 0)
    .map((v) => (v.price / v.bag_weight_grams) * 100));
  if (cpgs.length === 0) return { min: null, max: null };
  return { min: Math.min(...cpgs), max: Math.max(...cpgs) };
}

export default function IndexPage() {
  const navigate = useNavigate();
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [shipsTo, setShipsTo] = useState('');
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

  const allShipsTo = useMemo(() => {
    if (!roasters) return [];
    return Array.from(new Set(roasters.flatMap((r) => r.ships_to || []))).sort();
  }, [roasters]);

  const rows = useMemo(() => {
    if (!roasters) return [];
    // Qualifying criterion: roaster must ship beans online to appear in the directory.
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
    if (shipsTo) list = list.filter((r) => (r.ships_to || []).includes(shipsTo) || (r.ships_to || []).includes('WORLDWIDE'));

    // Pre-compute price ranges so sort comparators stay cheap.
    list = list.map((r) => ({ ...r, _range: priceRange(r) }));

    const mult = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sort) {
        case 'country': return countryName(a.country_code).localeCompare(countryName(b.country_code)) * mult;
        case 'region': return (a.region || '').localeCompare(b.region || '') * mult;
        case 'city': return (a.city || '').localeCompare(b.city || '') * mult;
        case 'coffees': return ((a.coffees_count ?? a.coffees.length) - (b.coffees_count ?? b.coffees.length)) * mult;
        case 'min_cpg': return ((a._range.min ?? Infinity) - (b._range.min ?? Infinity)) * mult;
        case 'max_cpg': return ((a._range.max ?? Infinity) - (b._range.max ?? Infinity)) * mult;
        case 'name':
        default:
          return a.name.localeCompare(b.name) * mult;
      }
    });
    return list;
  }, [roasters, search, region, country, shipsTo, sort, dir]);

  function toggleSort(field) {
    if (!SORT_FIELDS.includes(field)) return;
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setDir('asc'); }
  }
  const arrow = (f) => (sort === f ? (dir === 'asc' ? '↑' : '↓') : '↕');
  const hasFilters = search || region || country || shipsTo;

  if (error) {
    return (
      <div className="p-10 text-center text-red-700">
        <h3 className="font-bold mb-2">Failed to load</h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-600 mt-3">Make sure Laravel is running on localhost:8000.</p>
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
          <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-800">
            <option value="">All countries</option>
            {allCountries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
          {allRegions.length > 0 && (
            <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-800">
              <option value="">All states/provinces</option>
              {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          {allShipsTo.length > 0 && (
            <select value={shipsTo} onChange={(e) => setShipsTo(e.target.value)}
                    className="px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-amber-800"
                    title="Filter to roasters that ship to this country">
              <option value="">Ships anywhere</option>
              {allShipsTo.map((c) => <option key={c} value={c}>Ships to {countryName(c)}</option>)}
            </select>
          )}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setRegion(''); setCountry(''); setShipsTo(''); }}
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
                  ['country', 'Country'],
                  ['region', 'State / Province'],
                  ['city', 'City'],
                  ['coffees', 'Bean selection'],
                  ['min_cpg', 'Min ¢/g'],
                  ['max_cpg', 'Max ¢/g'],
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
                      onClick={() => navigate(`/roasters/${r.slug}`)}
                      className="hover:bg-amber-50 border-b border-gray-100 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/roasters/${r.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-amber-900 hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-amber-900">{countryName(r.country_code)}</td>
                    <td className="px-4 py-3 text-amber-900">{r.region || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-amber-900">{r.city || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-amber-900">{r.coffees_count ?? r.coffees.length} {(r.coffees_count ?? r.coffees.length) === 1 ? 'bean' : 'beans'}</td>
                    <td className={`px-4 py-3 font-bold ${minClass}`}>
                      {range.min != null ? `${range.min.toFixed(1)}¢` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-800">
                      {range.max != null ? `${range.max.toFixed(1)}¢` : <span className="text-gray-300">—</span>}
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

