import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authFetch, useAuth } from '../auth.jsx';

/**
 * Q10: per-user wishlist provider. Loads /api/wishlist once on auth,
 * exposes a Set of wishlisted coffee ids + add/remove methods. Heart
 * icons across the app consume this so toggling on one card updates
 * every other instance instantly.
 */
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { token, user } = useAuth();
  const [ids, setIds] = useState(new Set());
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      setIds(new Set());
      setItems([]);
      return;
    }
    authFetch(token, '/wishlist').then((d) => {
      setItems(d.items);
      setIds(new Set(d.items.map((it) => it.coffee?.id).filter(Boolean)));
    }).catch(() => {});
  }, [token, user]);

  const add = useCallback(async (coffeeId) => {
    if (!token || ids.has(coffeeId)) return;
    setIds((prev) => new Set(prev).add(coffeeId)); // optimistic
    try {
      await authFetch(token, '/wishlist', { method: 'POST', body: JSON.stringify({ coffee_id: coffeeId }) });
      // Refetch list so the wishlist page sees it
      const d = await authFetch(token, '/wishlist');
      setItems(d.items);
    } catch {
      // rollback on error
      setIds((prev) => { const n = new Set(prev); n.delete(coffeeId); return n; });
    }
  }, [token, ids]);

  const remove = useCallback(async (coffeeId) => {
    if (!token || !ids.has(coffeeId)) return;
    setIds((prev) => { const n = new Set(prev); n.delete(coffeeId); return n; });
    try {
      await authFetch(token, `/wishlist/${coffeeId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.coffee?.id !== coffeeId));
    } catch {
      setIds((prev) => new Set(prev).add(coffeeId));
    }
  }, [token, ids]);

  return (
    <WishlistContext.Provider value={{ ids, items, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be inside <WishlistProvider>');
  return ctx;
}
