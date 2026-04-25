import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import PriceHistoryChart from '../components/PriceHistoryChart.jsx';
import RoasterMap from '../components/RoasterMap.jsx';
import { countryName } from '../utils/countries.js';

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
  const [chartMode, setChartMode] = useState({});

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

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon="🚚" title="Online Shipping" available={roaster.has_shipping} badgeColor="green">
            {roaster.has_shipping && (
              <>
                {roaster.shipping_cost != null && (
                  <div className="text-sm text-amber-800">Flat rate: <span className="font-medium">${roaster.shipping_cost.toFixed(2)}</span></div>
                )}
                {roaster.free_shipping_over != null && (
                  <div className="text-sm text-amber-800">Free shipping over: <span className="font-medium">${roaster.free_shipping_over.toFixed(2)}</span></div>
                )}
                {roaster.shipping_notes && <div className="text-sm text-amber-700 mt-1">{roaster.shipping_notes}</div>}
              </>
            )}
          </InfoCard>
          <InfoCard icon="🔁" title="Subscription" available={roaster.has_subscription} badgeColor="purple">
            {roaster.has_subscription && roaster.subscription_notes && (
              <div className="text-sm text-amber-700">{roaster.subscription_notes}</div>
            )}
          </InfoCard>
        </div>
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
            const mode = chartMode[coffee.id] || 'price';
            return (
              <div key={coffee.id} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-amber-50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <h3 className="text-lg font-semibold text-amber-900">{coffee.name}</h3>
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
                      <tr key={v.id} className={`${!v.in_stock ? 'opacity-50' : ''} ${v.is_default ? 'bg-amber-50/60' : ''}`}>
                        <td className="px-5 py-2 font-medium text-amber-900">
                          {v.bag_weight_grams}g
                          {v.is_default && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide bg-amber-800 text-white px-1.5 py-0.5 rounded">default</span>
                          )}
                        </td>
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

                {coffee.variants.length > 0 && (
                  <div className="p-5 bg-amber-50/40 border-t border-amber-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-amber-900">Price history</h4>
                      <div className="flex bg-white rounded-md border border-amber-200 text-xs overflow-hidden">
                        <button
                          onClick={() => setChartMode((m) => ({ ...m, [coffee.id]: 'price' }))}
                          className={`px-3 py-1 transition-colors ${mode === 'price' ? 'bg-amber-800 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                        >
                          $
                        </button>
                        <button
                          onClick={() => setChartMode((m) => ({ ...m, [coffee.id]: 'cpg' }))}
                          className={`px-3 py-1 transition-colors ${mode === 'cpg' ? 'bg-amber-800 text-white' : 'text-amber-800 hover:bg-amber-100'}`}
                        >
                          ¢/g
                        </button>
                      </div>
                    </div>
                    <PriceHistoryChart variants={coffee.variants} mode={mode === 'cpg' ? 'cpg' : 'price'} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, title, available, badgeColor, children }) {
  const palette = badgeColor === 'purple'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-green-100 text-green-700 border-green-200';
  return (
    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="font-semibold text-amber-900">{title}</span>
        {available ? (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${palette}`}>Available</span>
        ) : (
          <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">Not available</span>
        )}
      </div>
      {children}
    </div>
  );
}
