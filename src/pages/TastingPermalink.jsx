import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ratingToStars, formatStars } from '../utils/rating.js';

/**
 * /t/:id — per-tasting public permalink. 404s if the tasting is private.
 */
export default function TastingPermalink() {
  const { id } = useParams();
  const [tasting, setTasting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTasting(null);
    setError(null);
    api.getPublicTasting(id).then((d) => setTasting(d.tasting)).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700">Tasting not found</h2>
        <p className="text-amber-700 mt-2">It may have been deleted or set to private.</p>
        <Link to="/" className="text-amber-800 underline mt-4 inline-block">← Home</Link>
      </div>
    );
  }
  if (!tasting) return <div className="p-10 text-center text-amber-800">Loading…</div>;

  const stars = ratingToStars(tasting.rating);
  const c = tasting.coffee;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          {tasting.user.avatar_url && (
            <img src={tasting.user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-amber-200" />
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/u/${tasting.user.display_name}`} className="text-amber-900 font-semibold hover:underline">
              {tasting.user.display_name || `User #${tasting.user.id}`}
            </Link>
            <div className="text-xs text-amber-600">
              {tasting.tasted_on}{tasting.brew_method ? ` · ${tasting.brew_method}` : ''}
            </div>
          </div>
          <div className="text-2xl text-amber-700 flex-shrink-0">
            {stars != null ? formatStars(stars) : <span className="text-amber-300 text-base">no rating</span>}
          </div>
        </div>

        {c && (
          <div className="border-t border-amber-100 pt-4 flex items-center gap-3">
            {c.image_url && (
              <img src={c.image_url} alt="" className={`w-16 h-16 rounded object-cover border border-amber-100 ${c.is_removed ? 'grayscale' : ''}`} />
            )}
            <div className="flex-1 min-w-0">
              <Link to={`/c/${c.id}`} className={`text-amber-900 font-medium hover:underline ${c.is_removed ? 'line-through' : ''}`}>
                {c.name}
              </Link>
              <div className="text-xs text-amber-600">
                <Link to={`/roasters/${c.roaster.slug}`} className="hover:underline">{c.roaster.name}</Link>
              </div>
              {c.is_removed && (
                <div className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                  no longer sold
                </div>
              )}
            </div>
          </div>
        )}

        {tasting.notes && (
          <div className="text-amber-900 mt-4 italic whitespace-pre-line">{tasting.notes}</div>
        )}
      </div>
    </div>
  );
}
