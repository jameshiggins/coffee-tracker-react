import { useAuth } from '../auth.jsx';
import { useFavoriteRoasters } from '../hooks/useFavoriteRoasters.jsx';
import Icon from './Icon.jsx';

/**
 * Bookmark toggle that pins/unpins a roaster (per-user favorite).
 * Pinned roasters sort to the top of the directory and appear in the
 * account page. Hidden when signed out — same convention as WishlistHeart.
 */
export default function FavoriteRoasterButton({ roaster, size = 18, className = '' }) {
  const { user } = useAuth();
  const { ids, toggle } = useFavoriteRoasters();
  if (!user) return null;

  const pinned = ids.has(roaster.id);
  const label = pinned ? `Unpin ${roaster.name}` : `Pin ${roaster.name}`;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pinned}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(roaster);
      }}
      className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${
        pinned
          ? 'text-accent hover:text-accent-hover'
          : 'text-fg-subtle hover:text-accent'
      } ${className}`}
    >
      <Icon name="bookmark" size={size} className={pinned ? 'fill-current' : ''} />
    </button>
  );
}
