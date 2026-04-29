import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import RoasterMap from '../components/RoasterMap.jsx';
import { countryName } from '../utils/countries.js';
import { formatBagWeight } from '../utils/units.js';

const ROAST_COLORS = {
  light: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  medium: 'bg-orange-50 text-orange-700 border-orange-200',
  'medium-dark': 'bg-orange-100 text-orange-800 border-orange-300',
  dark: 'bg-red-50 text-red-700 border-red-200',
};

export default function RoasterShow() {
  const { slug } = useParams();
  const [roaster, setRoaster] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRoaster(null);
    setError(null);
    api.getRoaster(slug)
      .then(setRoaster)
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="p-10 text-center text-red-700">
        <h2 className="text-2xl font-bold mb-2">Failed to load</h2>
        <p className="text-sm">{error}</p>
        <Link to="/" className="text-amber-700 hover:underline mt-3 inline-block">← Back</Link>
      </div>
    );
  }
  if (!roaster) {
    return <div className="p-10 text-center text-amber-800">Loading…</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/" className="text-amber-700 hover:text-amber-900 text-sm">← Back to Directory</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">{roaster.name}</h1>
            <div className="text-amber-700 mt-1">
              📍 {[
                roaster.street_address,
                roaster.city,
                roaster.region,
                roaster.postal_code,
                roaster.country_code ? countryName(roaster.country_code) : null,
              ].filter(Boolean).join(', ')}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {roaster.website && (
              <a href={roaster.website} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 bg-amber-800 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                🌐 Website
              </a>
            )}
            {roaster.instagram && (
              <a href={`https://instagram.com/${roaster.instagram.replace(/^@/, '')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                📸 Instagram
              </a>
            )}
          </div>
        </div>

        {roaster.description && <p className="mt-4 text-amber-900 leading-relaxed">{roaster.description}</p>}

        {roaster.street_address && roaster.latitude != null && (
          <div className="mt-6">
            <RoasterMap roaster={roaster} />
          </div>
        )}

      </div>

      <h2 className="text-xl font-bold text-amber-900 mb-4">Current Offerings ({roaster.coffees.length})</h2>

      {roaster.coffees.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-100 p-10 text-center text-amber-500">
          No offerings listed yet.
        </div>
      ) : (
        <div className="space-y-6">
          {roaster.coffees.map((coffee) => {
            const cl = ROAST_COLORS[(coffee.roast_level || '').toLowerCase()] || 'bg-amber-50 text-amber-700 border-amber-100';
            return (
              <div key={coffee.id} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-amber-50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <h3 className="text-lg font-semibold">
                        <Link to={`/c/${coffee.id}`} className="text-amber-900 hover:underline">
                          {coffee.name}
                        </Link>
                        {coffee.product_url && (
                          <a href={coffee.product_url} target="_blank" rel="noopener noreferrer"
                             className="ml-1 text-amber-500 text-xs hover:text-amber-700"
                             title="Open product page on roaster's site">
                            ↗
                          </a>
                        )}
                      </h3>
                      <div className="text-amber-700 text-sm mt-0.5">{coffee.origin}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {coffee.process && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2 py-0.5 rounded-full capitalize">
                            {coffee.process}
                          </span>
                        )}
                        {coffee.roast_level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${cl}`}>{coffee.roast_level}</span>
                        )}
                        {coffee.varietal && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-stone-50 text-stone-700 border-stone-200">
                            {coffee.varietal}
                          </span>
                        )}
                      </div>
                      {coffee.tasting_notes && (
                        <div className="text-amber-800 text-sm italic mt-2">{coffee.tasting_notes}</div>
                      )}
                      {coffee.description && (
                        <ExpandableDescription text={coffee.description} />
                      )}
                    </div>
                    {coffee.best_price_per_gram && (
                      <div className="text-right">
                        <div className="text-xs text-amber-600 uppercase tracking-wide">Best $/g</div>
                        <div className="text-2xl font-bold text-amber-900">${coffee.best_price_per_gram.toFixed(3)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-50 text-amber-800 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-2">Bag</th>
                      <th className="text-right px-5 py-2">Price</th>
                      <th className="text-right px-5 py-2">$/g</th>
                      <th className="text-right px-5 py-2">¢/g</th>
                      <th className="text-center px-5 py-2">Stock</th>
                      <th className="text-right px-5 py-2">Buy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {coffee.variants.map((v) => (
                      <tr key={v.id} className={!v.in_stock ? 'opacity-50' : ''}>
                        <td className="px-5 py-2 font-medium text-amber-900">{formatBagWeight(v.bag_weight_grams)}</td>
                        <td className="px-5 py-2 text-right">${v.price.toFixed(2)}</td>
                        <td className="px-5 py-2 text-right text-amber-700 font-mono text-xs">${v.price_per_gram.toFixed(3)}</td>
                        <td className="px-5 py-2 text-right text-amber-700 font-mono text-xs">{v.cents_per_gram.toFixed(1)}¢</td>
                        <td className="px-5 py-2 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${v.in_stock ? 'bg-green-400' : 'bg-red-300'}`}></span>
                        </td>
                        <td className="px-5 py-2 text-right">
                          {v.purchase_link ? (
                            <a href={v.purchase_link} target="_blank" rel="noopener noreferrer"
                               className="text-amber-700 hover:underline text-xs">Buy →</a>
                          ) : (
                            <span className="text-amber-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Q20: Inline show-more for long roaster-supplied bean descriptions.
 * Truncates at 600 chars; click "Show more" to expand inline.
 */
function ExpandableDescription({ text }) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text.trim();
  const cap = 600;
  const truncated = trimmed.length > cap;

  if (!truncated) {
    return <p className="text-amber-900 text-sm mt-3 leading-relaxed whitespace-pre-line">{trimmed}</p>;
  }
  return (
    <div className="text-amber-900 text-sm mt-3 leading-relaxed whitespace-pre-line">
      {expanded ? trimmed : trimmed.slice(0, cap).trim() + '…'}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="ml-1 text-amber-700 hover:underline text-xs"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

