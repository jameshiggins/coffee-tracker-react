import { useAuth } from '../auth.jsx';
import { useWishlist } from '../hooks/useWishlist.jsx';
import Icon from './Icon.jsx';

/**
 * Bookmark toggle that adds/removes a coffee from the user's wishlist (Q10).
 * A wishlist is "come back to this later" — a bookmark, the same glyph
 * Vivino/Untappd use for "want" — not "I love this", so it is deliberately
 * NOT a heart and NOT red. The heart belongs to roaster favourites
 * (FavoriteRoasterButton). Hidden when the user isn't logged in — prevents
 * a click-to-redirect dead end.
 */
export default function WishlistHeart({ coffeeId, size = 'md' }) {
  const { user } = useAuth();
  const { ids, add, remove } = useWishlist();
  if (!user) return null;

  const wishlisted = ids.has(coffeeId);
  const label = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';
  const px = size === 'lg' ? 24 : 20;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={wishlisted}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        wishlisted ? remove(coffeeId) : add(coffeeId);
      }}
      className={`inline-flex items-center justify-center rounded-md p-1 transition-colors ${
        wishlisted ? 'text-accent hover:text-accent-hover' : 'text-fg-subtle hover:text-accent'
      }`}
    >
      <Icon name="bookmark" size={px} className={wishlisted ? 'fill-current' : ''} />
    </button>
  );
}
