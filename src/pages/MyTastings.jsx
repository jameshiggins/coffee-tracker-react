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

  if (loading) return <div className="p-10 text-center text-amber-800">Loading…</div>;
  if (!token) return <Navigate to="/" replace />;
  if (error) return <div className="p-10 text-center text-red-700">{error}</div>;
  if (!tastings) return <div className="p-10 text-center text-amber-800">Loading your tastings…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {user?.avatar_url && (
          <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full border border-amber-200" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-amber-900">{user?.display_name || user?.email}</h1>
          <p className="text-sm text-amber-600">Your tastings</p>
        </div>
      </div>

      {tastings.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 p-10 text-center rounded-xl text-amber-700">
          No tastings yet. Visit a roaster or browse the <Link to="/beans" className="underline">beans page</Link> and log one.
        </div>
      ) : (
        <div className="space-y-3">
          {tastings.map((t) => (
            <div key={t.id} className="bg-white border border-amber-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-amber-900 font-medium">Coffee #{t.coffee_id}</div>
                  <div className="text-xs text-amber-500">{t.tasted_on}{t.brew_method ? ` • ${t.brew_method}` : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-700 text-lg">{ratingStars(t.rating) || <span className="text-amber-300 text-sm">no rating</span>}</div>
                  {!t.is_public && <div className="text-[10px] uppercase tracking-wide text-amber-400 mt-1">private</div>}
                </div>
              </div>
              {t.notes && <div className="text-sm text-amber-800 mt-2 italic">{t.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
