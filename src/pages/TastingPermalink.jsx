import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ratingToStars, formatStars } from '../utils/rating.js';
import ReportTastingButton from '../components/ReportTastingButton.jsx';
import { formatDate } from '../utils/format.js';

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
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Tasting not found</h2>
        <p className="text-fg-muted mt-2">It may have been deleted or set to private.</p>
        <Link to="/" className="text-accent underline mt-4 inline-block">← Home</Link>
      </div>
    );
  }
  if (!tasting) return <div className="p-10 text-center text-fg">Loading…</div>;

  const stars = ratingToStars(tasting.rating);
  const c = tasting.coffee;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          {tasting.user.avatar_url && (
            <img src={tasting.user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-border-strong" />
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/u/${tasting.user.display_name}`} className="text-fg font-semibold hover:underline">
              {tasting.user.display_name || `User #${tasting.user.id}`}
            </Link>
            <div className="text-xs text-fg-muted">
              <span className="whitespace-nowrap">{formatDate(tasting.tasted_on)}</span>{tasting.brew_method ? ` · ${tasting.brew_method}` : ''}
            </div>
          </div>
          <div className="text-2xl text-fg-muted flex-shrink-0">
            {stars != null ? formatStars(stars) : <span className="text-fg-subtle text-base">no rating</span>}
          </div>
        </div>

        {c && (
          <div className="border-t border-border pt-4 flex items-center gap-3">
            {c.image_url && (
              <img src={c.image_url} alt="" className={`w-16 h-16 rounded object-cover border border-border ${c.is_removed ? 'grayscale' : ''}`} />
            )}
            <div className="flex-1 min-w-0">
              <Link to={`/c/${c.id}`} className={`text-fg font-medium hover:underline ${c.is_removed ? 'line-through' : ''}`}>
                {c.name}
              </Link>
              <div className="text-xs text-fg-muted">
                <Link to={`/roasters/${c.roaster.slug}`} className="hover:underline">{c.roaster.name}</Link>
              </div>
              {c.is_removed && (
                <div className="inline-block mt-1 text-[11px] sm:text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                  no longer sold
                </div>
              )}
            </div>
          </div>
        )}

        {tasting.notes && (
          <div className="text-fg mt-4 italic whitespace-pre-line">{tasting.notes}</div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <ReportTastingButton tastingId={tasting.id} />
        </div>
      </div>
    </div>
  );
}
