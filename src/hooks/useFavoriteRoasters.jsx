import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authFetch, useAuth } from '../auth.jsx';

/**
 * Per-user pinned/favorite roasters — the roaster-level sibling of the
 * wishlist provider. Loads /api/me/favorite-roasters once on auth, exposes
 * a Set of favorited roaster ids + toggle methods. The roaster directory
 * pins favorites to the top; the account page lists them with unpin.
 */
const FavoriteRoastersContext = createContext(null);

export function FavoriteRoastersProvider({ children }) {
  const { token, user } = useAuth();
  const [ids, setIds] = useState(new Set());
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      setIds(new Set());
      setItems([]);
      return;
    }
    authFetch(token, '/me/favorite-roasters').then((d) => {
      setItems(d.items);
      setIds(new Set(d.items.map((it) => it.roaster?.id).filter(Boolean)));
    }).catch(() => {});
  }, [token, user]);

  const add = useCallback(async (roaster) => {
    if (!token || ids.has(roaster.id)) return;
    setIds((prev) => new Set(prev).add(roaster.id)); // optimistic
    try {
      await authFetch(token, '/me/favorite-roasters', {
        method: 'POST',
        body: JSON.stringify({ roaster_id: roaster.id }),
      });
      const d = await authFetch(token, '/me/favorite-roasters');
      setItems(d.items);
    } catch {
      setIds((prev) => { const n = new Set(prev); n.delete(roaster.id); return n; }); // rollback
    }
  }, [token, ids]);

  const remove = useCallback(async (roaster) => {
    if (!token || !ids.has(roaster.id)) return;
    setIds((prev) => { const n = new Set(prev); n.delete(roaster.id); return n; });
    try {
      await authFetch(token, `/me/favorite-roasters/${encodeURIComponent(roaster.slug)}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.roaster?.id !== roaster.id));
    } catch {
      setIds((prev) => new Set(prev).add(roaster.id)); // rollback
    }
  }, [token, ids]);

  const toggle = useCallback(
    (roaster) => (ids.has(roaster.id) ? remove(roaster) : add(roaster)),
    [ids, add, remove]
  );

  return (
    <FavoriteRoastersContext.Provider value={{ ids, items, add, remove, toggle }}>
      {children}
    </FavoriteRoastersContext.Provider>
  );
}

export function useFavoriteRoasters() {
  const ctx = useContext(FavoriteRoastersContext);
  if (!ctx) throw new Error('useFavoriteRoasters must be inside <FavoriteRoastersProvider>');
  return ctx;
}
