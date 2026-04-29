import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { countryName } from '../utils/countries.js';
import { formatBagWeight } from '../utils/units.js';
import { ratingToStars, formatStars } from '../utils/rating.js';
import TastingForm from '../components/TastingForm.jsx';

const ROAST_COLORS = {
  light: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  medium: 'bg-orange-50 text-orange-700 border-orange-200',
  'medium-dark': 'bg-orange-100 text-orange-800 border-orange-300',
  dark: 'bg-red-50 text-red-700 border-red-200',
};

export default function CoffeeShow() {
  const { id } = useParams();
  const { user } = useAuth();
  const [coffee, setCoffee] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [tastings, setTastings] = useState([]);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setCoffee(null);
    setError(null);
    api.getCoffee(id)
      .then((d) => setCoffee(d.coffee))
      .catch((e) => setError(e.message));
    api.getCoffeeTastings(id).then((d) => setTastings(d.tastings)).catch(() => {});
  }, [id]);

  if (error) return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold text-red-700">Coffee not found</h2>
      <Link to="/beans" className="text-amber-700 hover:underline mt-3 inline-block">← Browse beans</Link>
    </div>
  );
  if (!coffee) return <div className="p-10 text-center text-amber-800">Loading…</div>;

  const stars = ratingToStars(coffee.rating?.average);
  const cl = ROAST_COLORS[(coffee.roast_level || '').toLowerCase()] || 'bg-amber-50 text-amber-700 border-amber-100';
  const description = (coffee.description ?? '').trim();
  const descCap = 600;
  const descTruncated = description.length > descCap && !descExpanded;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/beans" className="text-amber-700 hover:text-amber-900 text-sm">← All beans</Link>
      </div>

      <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr] gap-6 p-6">
          {coffee.image_url && (
            <div className="bg-amber-50 rounded-lg overflow-hidden border border-amber-100 aspect-square">
              <img
                src={coffee.image_url}
                alt={coffee.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="min-w-0">
            <Link to={`/roasters/${coffee.roaster.slug}`}
                  className="text-xs uppercase tracking-wide text-amber-600 hover:text-amber-800">
              {coffee.roaster.name} · {coffee.roaster.city}{coffee.roaster.region ? `, ${coffee.roaster.region}` : ''}
            </Link>
            <h1 className="text-3xl font-bold text-amber-900 leading-tight mt-1">{coffee.name}</h1>
            {coffee.is_removed && (
              <div className="inline-block mt-2 text-xs uppercase tracking-wide bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                no longer sold
              </div>
            )}

            {coffee.origin && <div className="text-amber-800 mt-2">{coffee.origin}</div>}

            <div className="flex flex-wrap gap-2 mt-3">
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
              <span className="text-xs px-2 py-0.5 rounded-full border bg-cyan-50 text-cyan-700 border-cyan-200">
                {coffee.is_blend ? 'Blend' : 'Single-origin'}
              </span>
            </div>

            {/* Q8: aggregate community rating, always shown with explicit count */}
            <div className="mt-4 flex items-center gap-3">
              {stars != null ? (
                <>
                  <span className="text-2xl text-amber-700">{formatStars(stars)}</span>
                  <span className="text-amber-900 font-semibold">{stars.toFixed(1)} / 5</span>
                  <span className="text-amber-600 text-sm">
                    from {coffee.rating.count} {coffee.rating.count === 1 ? 'tasting' : 'tastings'}
                  </span>
                </>
              ) : (
                <span className="text-amber-500 text-sm italic">No ratings yet — be the first to taste this.</span>
              )}
            </div>

            {coffee.tasting_notes && (
              <div className="mt-4 text-amber-800 italic">{coffee.tasting_notes}</div>
            )}

            {description && (
              <div className="mt-4 text-amber-900 text-sm leading-relaxed whitespace-pre-line">
                {descTruncated ? description.slice(0, descCap).trim() + '…' : description}
                {description.length > descCap && (
                  <button onClick={() => setDescExpanded((v) => !v)}
                          className="ml-1 text-amber-700 hover:underline text-xs">
                    {descExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {coffee.product_url && (
              <a href={coffee.product_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex mt-5 bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 rounded-lg text-sm font-medium">
                Buy from {coffee.roaster.name} ↗
              </a>
            )}
          </div>
        </div>

        {coffee.variants.length > 0 && (
          <div className="border-t border-amber-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-amber-800 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-2">Bag</th>
                  <th className="text-right px-5 py-2">Price</th>
                  <th className="text-right px-5 py-2">$/g</th>
                  <th className="text-right px-5 py-2">¢/g</th>
                  <th className="text-center px-5 py-2">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {coffee.variants.map((v) => (
                  <tr key={v.id} className={!v.in_stock ? 'opacity-50' : ''}>
                    <td className="px-5 py-2 font-medium text-amber-900">{formatBagWeight(v.bag_weight_grams)}</td>
                    <td className="px-5 py-2 text-right font-medium text-amber-900">
                      {v.currency_code !== 'CAD' && <span className="text-amber-500 text-xs mr-1">{v.currency_code}</span>}
                      ${v.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-2 text-right text-amber-700 font-mono text-xs">${v.price_per_gram.toFixed(3)}</td>
                    <td className="px-5 py-2 text-right text-amber-700 font-mono text-xs">{v.cents_per_gram.toFixed(1)}¢</td>
                    <td className="px-5 py-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${v.in_stock ? 'bg-green-400' : 'bg-red-300'}`}
                            title={v.in_stock ? 'In stock' : 'Out of stock'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* I tasted this */}
      {user && !coffee.is_removed && (
        <div className="mt-6 bg-white rounded-xl border border-amber-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-amber-900">Log a tasting</h2>
            {!showForm && (
              <button onClick={() => { setShowForm(true); setSavedMsg(false); }}
                      className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-md">
                ☕ I tasted this
              </button>
            )}
          </div>
          {savedMsg && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 mb-3">
              Tasting saved.
            </div>
          )}
          {showForm && (
            <TastingForm
              coffee={coffee}
              onSaved={() => {
                setShowForm(false);
                setSavedMsg(true);
                api.getCoffeeTastings(id).then((d) => setTastings(d.tastings)).catch(() => {});
                api.getCoffee(id).then((d) => setCoffee(d.coffee)).catch(() => {});
              }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {/* Public tastings feed */}
      {tastings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-amber-900 mb-3">
            What people think · {tastings.length} {tastings.length === 1 ? 'tasting' : 'tastings'}
          </h2>
          <div className="space-y-3">
            {tastings.map((t) => (
              <div key={t.id} className="bg-white border border-amber-100 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2">
                    {t.user.avatar_url && (
                      <img src={t.user.avatar_url} alt="" className="w-8 h-8 rounded-full border border-amber-100" />
                    )}
                    <div>
                      {t.user.display_name ? (
                        <Link to={`/u/${t.user.display_name}`} className="text-sm text-amber-900 font-medium hover:underline">
                          {t.user.display_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-amber-900 font-medium">User #{t.user.id}</span>
                      )}
                      <div className="text-xs text-amber-500">
                        <Link to={`/t/${t.id}`} className="hover:underline">{t.tasted_on}</Link>
                        {t.brew_method ? ` · ${t.brew_method}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-amber-700 text-lg">
                    {t.rating != null ? formatStars(ratingToStars(t.rating)) : <span className="text-amber-300 text-sm">no rating</span>}
                  </div>
                </div>
                {t.notes && <div className="text-sm text-amber-800 mt-2 italic whitespace-pre-line">{t.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
