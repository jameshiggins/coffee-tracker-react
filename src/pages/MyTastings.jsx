import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authFetch, useAuth } from '../auth.jsx';

function ratingStars(rating) {
  if (rating == null) return null;
  const stars = rating / 2;
  return '★'.repeat(Math.floor(stars)) + (stars % 1 === 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(stars));
}

export default function MyTastings() {
  const { token, user, loading } = useAuth();
  const [tastings, setTastings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    authFetch(token, '/tastings')
      .then((d) => setTastings(d.tastings))
      .catch((e) => setError(e.message));
  }, [token]);

  if (loading) return <div className="p-10 text-center text-fg">Loading…</div>;
  if (!token) return <Navigate to="/" replace />;
  if (error) return <div className="p-10 text-center text-red-700 dark:text-red-400">{error}</div>;
  if (!tastings) return <div className="p-10 text-center text-fg">Loading your tastings…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {user?.avatar_url && (
          <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-border-strong" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-fg">{user?.display_name || user?.email}</h1>
          <p className="text-sm text-fg-muted">Your tastings</p>
        </div>
      </div>

      {tastings.length === 0 ? (
        <div className="bg-surface-muted border border-border p-10 text-center rounded-xl text-fg-muted">
          No tastings yet. Visit a roaster or browse the <Link to="/beans" className="underline">beans page</Link> and log one.
        </div>
      ) : (
        <div className="space-y-3">
          {tastings.map((t) => (
            <TastingRow key={t.id} tasting={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TastingRow({ tasting: t }) {
  const c = t.coffee;
  const removed = c?.is_removed;
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 shadow-sm flex gap-4 ${removed ? 'opacity-70' : ''}`}>
      {c?.image_url && (
        <img
          src={c.image_url}
          alt=""
          loading="lazy"
          className={`w-20 h-20 rounded-md object-cover flex-shrink-0 border border-border ${removed ? 'grayscale' : ''}`}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            {c ? (
              <Link
                to={`/c/${c.id}`}
                className={`text-fg font-medium hover:underline ${removed ? 'line-through' : ''}`}
              >
                {c.name}
              </Link>
            ) : (
              <span className="text-fg font-medium">Coffee #{t.coffee_id}</span>
            )}
            {c && (
              <div className="text-xs text-fg-subtle">
                <Link to={`/roasters/${c.roaster.slug}`} className="hover:underline">{c.roaster.name}</Link>
                {' · '}{t.tasted_on}{t.brew_method ? ` · ${t.brew_method}` : ''}
              </div>
            )}
            {!c && (
              <div className="text-xs text-fg-subtle">{t.tasted_on}{t.brew_method ? ` · ${t.brew_method}` : ''}</div>
            )}
            {removed && (
              <div className="inline-block mt-1 text-[11px] sm:text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                no longer sold
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-fg-muted text-lg">
              {ratingStars(t.rating) || <span className="text-fg-subtle text-sm">no rating</span>}
            </div>
            {!t.is_public && (
              <div className="text-[11px] sm:text-[10px] uppercase tracking-wide text-fg-subtle mt-1">private</div>
            )}
          </div>
        </div>
        {t.notes && <div className="text-sm text-fg mt-2 italic whitespace-pre-line">{t.notes}</div>}
      </div>
    </div>
  );
}
