import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { flattenBeans, uniqueSorted } from '../utils/beans.js';
import { countryName } from '../utils/countries.js';
import { formatBagWeight } from '../utils/units.js';
import { isCoffeeInStock } from '../utils/stock.js';
import { useShowOutOfStock } from '../hooks/useShowOutOfStock.js';
import TastingForm from '../components/TastingForm.jsx';
import { useAuth } from '../auth.jsx';

const FACETS = [
  { key: 'country', label: 'Bean origin' },
  { key: 'process', label: 'Process' },
  { key: 'roast_level', label: 'Roast' },
  { key: 'varietal', label: 'Varietal' },
  { key: 'roaster_country', label: 'Roaster country', renderOption: (v) => countryName(v) },
  { key: 'roaster_region', label: 'Roaster state/province' },
];

export default function BeansPage() {
  const [roasters, setRoasters] = useState(null);
  const [error, setError] = useState(null);
  const [params, setParams] = useSearchParams();
  const [showOutOfStock, setShowOutOfStock] = useShowOutOfStock();

  useEffect(() => {
    api.listRoasters().then((d) => setRoasters(d.roasters)).catch((e) => setError(e.message));
  }, []);

  const beans = useMemo(() => roasters ? flattenBeans(roasters) : [], [roasters]);

  const facetOptions = useMemo(() => {
    const opts = {};
    for (const { key } of FACETS) opts[key] = uniqueSorted(beans.map((b) => b[key]));
    opts.tasting_token = uniqueSorted(beans.flatMap((b) => b.tokens));
    return opts;
  }, [beans]);

  const filters = {
    search: params.get('q') ?? '',
    country: params.get('country') ?? '',
    process: params.get('process') ?? '',
    roast_level: params.get('roast') ?? '',
    varietal: params.get('varietal') ?? '',
    roaster_country: params.get('rcountry') ?? '',
    roaster_region: params.get('rregion') ?? '',
    note: params.get('note') ?? '',
    blend: params.get('blend') ?? '', // '' = any, 'single' = single-origin only, 'blend' = blends only
  };

  const PARAM_MAP = { roast_level: 'roast', search: 'q', roaster_country: 'rcountry', roaster_region: 'rregion' };

  function setFilter(key, value) {
    const queryKey = PARAM_MAP[key] ?? key;
    const next = new URLSearchParams(params);
    if (value) next.set(queryKey, value); else next.delete(queryKey);
    setParams(next, { replace: true });
  }

  function findSimilar(bean) {
    const next = new URLSearchParams();
    if (bean.country) next.set('country', bean.country);
    if (bean.process) next.set('process', bean.process);
    if (bean.roast_level) next.set('roast', bean.roast_level);
    if (bean.varietal) next.set('varietal', bean.varietal);
    setParams(next, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true });
  }

  const filtered = useMemo(() => {
    let list = beans;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        (b.origin || '').toLowerCase().includes(q) ||
        (b.varietal || '').toLowerCase().includes(q) ||
        (b.tasting_notes || '').toLowerCase().includes(q) ||
        b.roaster.name.toLowerCase().includes(q)
      );
    }
    if (filters.country) list = list.filter((b) => b.country === filters.country);
    if (filters.process) list = list.filter((b) => b.process === filters.process);
    if (filters.roast_level) list = list.filter((b) => b.roast_level === filters.roast_level);
    if (filters.varietal) list = list.filter((b) => b.varietal === filters.varietal);
    if (filters.roaster_country) list = list.filter((b) => b.roaster_country === filters.roaster_country);
    if (filters.roaster_region) list = list.filter((b) => b.roaster_region === filters.roaster_region);
    if (filters.blend === 'single') list = list.filter((b) => !b.is_blend);
    if (filters.blend === 'blend') list = list.filter((b) => b.is_blend);
    if (filters.note) {
      const note = filters.note.toLowerCase();
      list = list.filter((b) => b.tokens.some((t) => t.includes(note)));
    }
    if (!showOutOfStock) list = list.filter(isCoffeeInStock);
    return list;
  }, [beans, filters, showOutOfStock]);

  const activeChips = [
    filters.country && { key: 'country', label: `origin: ${filters.country}` },
    filters.process && { key: 'process', label: `process: ${filters.process}` },
    filters.roast_level && { key: 'roast_level', label: `roast: ${filters.roast_level}` },
    filters.varietal && { key: 'varietal', label: filters.varietal },
    filters.roaster_country && { key: 'roaster_country', label: `roaster country: ${countryName(filters.roaster_country)}` },
    filters.roaster_region && { key: 'roaster_region', label: `roaster state/province: ${filters.roaster_region}` },
    filters.note && { key: 'note', label: `notes: ${filters.note}` },
    filters.blend && { key: 'blend', label: filters.blend === 'single' ? 'single-origin only' : 'blends only' },
  ].filter(Boolean);

  if (error) {
    return <div className="p-10 text-center text-red-700">Failed: {error}</div>;
  }
  if (!roasters) return <div className="p-10 text-center text-amber-800">Loading…</div>;

  return (
    <div>
      <div className="p-5 bg-gray-50 border-b border-gray-200">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search beans, origins, varietals, tasting notes..."
          className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-amber-800 mb-3"
        />

        <div className="flex flex-wrap gap-2 items-center">
          {FACETS.map(({ key, label, renderOption }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(e) => setFilter(key, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-amber-800"
            >
              <option value="">{label}: any</option>
              {facetOptions[key]?.map((opt) => (
                <option key={opt} value={opt}>{renderOption ? renderOption(opt) : opt}</option>
              ))}
            </select>
          ))}
          <select
            value={filters.blend}
            onChange={(e) => setFilter('blend', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-amber-800"
          >
            <option value="">Single-origin & blends</option>
            <option value="single">Single-origin only</option>
            <option value="blend">Blends only</option>
          </select>
          <input
            type="text"
            value={filters.note}
            onChange={(e) => setFilter('note', e.target.value)}
            placeholder="tasting note (e.g. blueberry)"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-amber-800"
          />
          <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="accent-amber-700"
            />
            Show sold out
          </label>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key, '')}
                className="bg-amber-800 hover:bg-amber-900 text-white text-xs px-3 py-1 rounded-full transition-colors"
              >
                {chip.label} <span className="ml-1">×</span>
              </button>
            ))}
            <button onClick={clearAll} className="text-amber-800 hover:underline text-xs ml-2">Clear all</button>
          </div>
        )}
      </div>

      <div className="p-3 bg-amber-50/50 text-sm text-amber-800">
        Showing <strong>{filtered.length}</strong> bean{filtered.length === 1 ? '' : 's'}
        {beans.length !== filtered.length && <> of {beans.length} total</>}
      </div>

      <div className="p-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-10 text-amber-700">
            No beans match those filters.
            <button onClick={clearAll} className="ml-2 underline">Reset</button>
          </div>
        ) : filtered.map((b) => <BeanCard key={b.id} bean={b} onFindSimilar={findSimilar} onTagClick={setFilter} />)}
      </div>
    </div>
  );
}

function BeanCard({ bean, onFindSimilar, onTagClick }) {
  const def = bean.default_variant;
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 flex flex-col">
      <div className="flex justify-between items-start gap-2 mb-1">
        <Link to={`/roasters/${bean.roaster.slug}`} className="text-xs text-amber-600 hover:underline uppercase tracking-wide">
          {bean.roaster.name}
        </Link>
        {bean.best_price_per_gram != null && (
          <span className="text-xs font-mono text-amber-700">${bean.best_price_per_gram.toFixed(3)}/g</span>
        )}
      </div>
      <h3 className="text-lg font-bold text-amber-900 leading-tight">{bean.name}</h3>
      {bean.origin && <div className="text-sm text-amber-700 mt-0.5">{bean.origin}</div>}

      <div className="flex flex-wrap gap-1.5 mt-2">
        <FilterChip
          onClick={() => onTagClick('blend', bean.is_blend ? 'blend' : 'single')}
          color={bean.is_blend ? 'orange' : 'cyan'}
        >
          {bean.is_blend ? 'Blend' : 'Single-origin'}
        </FilterChip>
        {bean.country && <FilterChip onClick={() => onTagClick('country', bean.country)} color="cyan">{bean.country}</FilterChip>}
        {bean.process && <FilterChip onClick={() => onTagClick('process', bean.process)} color="amber">{bean.process}</FilterChip>}
        {bean.roast_level && <FilterChip onClick={() => onTagClick('roast_level', bean.roast_level)} color="orange">{bean.roast_level}</FilterChip>}
        {bean.varietal && <FilterChip onClick={() => onTagClick('varietal', bean.varietal)} color="stone">{bean.varietal}</FilterChip>}
      </div>

      {bean.tasting_notes && (
        <div className="text-sm text-amber-800 italic mt-3 leading-relaxed">{bean.tasting_notes}</div>
      )}

      {def && (
        <div className="mt-auto pt-3 border-t border-amber-100 mt-3 flex items-end justify-between gap-2 flex-wrap">
          <div className="text-xs text-amber-600">
            <span className="text-amber-900 font-medium">{formatBagWeight(def.bag_weight_grams)}</span>
            {' · '}<span className="text-amber-900 font-medium">${def.price.toFixed(2)}</span>
          </div>
          <div className="flex gap-1.5">
            {user && (
              <button
                onClick={() => { setShowForm((s) => !s); setSavedMsg(false); }}
                className="bg-green-700 hover:bg-green-800 text-white text-xs px-2.5 py-1.5 rounded-md transition-colors"
              >
                {showForm ? 'Cancel' : '☕ I tasted this'}
              </button>
            )}
            <button
              onClick={() => onFindSimilar(bean)}
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
            >
              Find similar →
            </button>
          </div>
        </div>
      )}

      {savedMsg && (
        <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
          Tasting saved.
        </div>
      )}
      {showForm && (
        <div className="mt-3">
          <TastingForm
            coffee={bean}
            onSaved={() => { setShowForm(false); setSavedMsg(true); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}

const COLOR_CLASSES = {
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  stone: 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
};

function FilterChip({ children, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2 py-0.5 rounded-full border capitalize transition-colors ${COLOR_CLASSES[color]}`}
    >
      {children}
    </button>
  );
}
