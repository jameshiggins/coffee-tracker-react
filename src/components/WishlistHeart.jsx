import { useAuth } from '../auth.jsx';
import { useWishlist } from '../hooks/useWishlist.jsx';

/**
 * Heart icon that toggles a coffee in the user's wishlist (Q10).
 * Hidden when the user isn't logged in — prevents a click-to-redirect
 * dead end.
 */
export default function WishlistHeart({ coffeeId, size = 'md' }) {
  const { user } = useAuth();
  const { ids, add, remove } = useWishlist();
  if (!user) return null;

  const wishlisted = ids.has(coffeeId);
  const label = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';
  const px = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <button
      type="button"
      title={label}
      aria-pressed={wishlisted}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        wishlisted ? remove(coffeeId) : add(coffeeId);
      }}
      className={`${px} transition-colors leading-none ${
        wishlisted ? 'text-red-500 hover:text-red-600' : 'text-amber-300 hover:text-red-400'
      }`}
    >
      {wishlisted ? '♥' : '♡'}
    </button>
  );
}
