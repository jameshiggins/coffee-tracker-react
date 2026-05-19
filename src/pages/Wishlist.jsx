import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useWishlist } from '../hooks/useWishlist.jsx';

export default function Wishlist() {
  const { token, loading } = useAuth();
  const { items, remove } = useWishlist();

  if (loading) return <div className="p-10 text-center text-amber-800">Loading…</div>;
  if (!token) return <Navigate to="/sign-in" replace />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-amber-900 mb-1">Your wishlist</h1>
      <p className="text-sm text-amber-600 mb-6">{items.length} bean{items.length === 1 ? '' : 's'} saved for later</p>

      {items.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 p-10 text-center rounded-xl text-amber-700">
          Nothing here yet. Hit the ♡ on any bean to save it.
          <div className="mt-3"><Link to="/beans" className="underline">Browse beans</Link></div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => {
            const c = it.coffee;
            if (!c) return null;
            return (
              <div key={it.id} className={`bg-white border border-amber-100 rounded-lg p-4 shadow-sm flex gap-3 ${c.is_removed ? 'opacity-70' : ''}`}>
                {c.image_url && (
                  <img src={c.image_url} alt=""
                       className={`w-16 h-16 rounded object-cover border border-amber-100 flex-shrink-0 ${c.is_removed ? 'grayscale' : ''}`}
                       onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/c/${c.id}`}
                        className={`text-amber-900 font-medium hover:underline ${c.is_removed ? 'line-through' : ''}`}>
                    {c.name}
                  </Link>
                  <div className="text-xs text-amber-500">
                    <Link to={`/roasters/${c.roaster.slug}`} className="hover:underline">{c.roaster.name}</Link>
                  </div>
                  {c.is_removed && (
                    <div className="inline-block mt-1 text-[11px] sm:text-[10px] uppercase tracking-wide bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                      no longer sold
                    </div>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
