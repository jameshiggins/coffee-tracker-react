import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ratingToStars, formatStars } from '../utils/rating.js';

/**
 * /u/:displayName — public profile page. Lists all of this user's
 * public tastings (Q9). Private tastings are filtered server-side.
 */
export default function UserProfile() {
  const { displayName } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.getUserProfile(displayName)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [displayName]);

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Profile not found</h2>
        <Link to="/" className="text-accent underline mt-4 inline-block">← Home</Link>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-center text-fg">Loading…</div>;

  const { user, tastings } = data;
  const ratedCount = tastings.filter((t) => t.rating != null).length;
  const avgStars = ratedCount > 0
    ? tastings.filter((t) => t.rating != null).reduce((s, t) => s + t.rating, 0) / ratedCount / 2
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        {user.avatar_url && (
          <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full border border-border-strong" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-fg">{user.display_name}</h1>
          <p className="text-sm text-fg-muted">
            {tastings.length} public tasting{tastings.length === 1 ? '' : 's'}
            {avgStars != null && ` · avg ${avgStars.toFixed(1)} / 5 ★`}
          </p>
        </div>
      </div>

      {tastings.length === 0 ? (
        <div className="bg-surface-muted border border-border p-10 text-center rounded-xl text-fg-muted">
          No public tastings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tastings.map((t) => (
            <div key={t.id} className="bg-surface border border-border rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {t.coffee?.image_url && (
                  <img src={t.coffee.image_url} alt=""
                       className={`w-16 h-16 rounded object-cover border border-border flex-shrink-0 ${t.coffee.is_removed ? 'grayscale' : ''}`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      {t.coffee ? (
                        <Link to={`/c/${t.coffee.id}`}
                              className={`text-fg font-medium hover:underline ${t.coffee.is_removed ? 'line-through' : ''}`}>
                          {t.coffee.name}
                        </Link>
                      ) : (
                        <span className="text-fg font-medium">Coffee removed</span>
                      )}
                      <div className="text-xs text-fg-muted">
                        {t.coffee && (
                          <Link to={`/roasters/${t.coffee.roaster.slug}`} className="hover:underline">
                            {t.coffee.roaster.name}
                          </Link>
                        )}
                        {' · '}<Link to={`/t/${t.id}`} className="hover:underline">{t.tasted_on}</Link>
                        {t.brew_method ? ` · ${t.brew_method}` : ''}
                      </div>
                    </div>
                    <div className="text-fg-muted text-lg flex-shrink-0">
                      {t.rating != null ? formatStars(ratingToStars(t.rating)) : <span className="text-fg-subtle text-sm">no rating</span>}
                    </div>
                  </div>
                  {t.notes && <div className="text-sm text-fg mt-2 italic whitespace-pre-line">{t.notes}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
