import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import WishlistHeart from './WishlistHeart.jsx';

const mockAuth = { user: { id: 1, email: 'a@example.com' } };
vi.mock('../auth.jsx', () => ({
  useAuth: () => mockAuth,
}));

const add = vi.fn();
const remove = vi.fn();
let wishlistIds = new Set();
vi.mock('../hooks/useWishlist.jsx', () => ({
  useWishlist: () => ({ ids: wishlistIds, add, remove }),
}));

describe('WishlistHeart', () => {
  afterEach(() => {
    cleanup();
    add.mockClear();
    remove.mockClear();
    wishlistIds = new Set();
    mockAuth.user = { id: 1, email: 'a@example.com' };
  });

  it('renders an accessible unpressed toggle when not wishlisted', () => {
    render(<WishlistHeart coffeeId={42} />);
    const btn = screen.getByRole('button', { name: 'Add to wishlist' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders a pressed toggle when wishlisted', () => {
    wishlistIds = new Set([42]);
    render(<WishlistHeart coffeeId={42} />);
    expect(screen.getByRole('button', { name: 'Remove from wishlist' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('uses the bookmark glyph, not a heart — a wishlist is "buy later", not "love"', () => {
    const { container } = render(<WishlistHeart coffeeId={42} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.textContent).not.toMatch(/[♥♡]/);
    // Favourite roasters own the heart; the two must stay distinct.
    expect(container.querySelector('button').className).not.toMatch(/red/);
  });

  it('adds when not wishlisted and removes when wishlisted', () => {
    const { unmount } = render(<WishlistHeart coffeeId={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    expect(add).toHaveBeenCalledWith(42);
    expect(remove).not.toHaveBeenCalled();
    unmount();

    wishlistIds = new Set([42]);
    render(<WishlistHeart coffeeId={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove from wishlist' }));
    expect(remove).toHaveBeenCalledWith(42);
  });

  it('does not bubble the click to a wrapping card', () => {
    const onCardClick = vi.fn();
    render(
      <div onClick={onCardClick}>
        <WishlistHeart coffeeId={42} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('renders nothing when signed out', () => {
    mockAuth.user = null;
    const { container } = render(<WishlistHeart coffeeId={42} />);
    expect(container).toBeEmptyDOMElement();
  });
});
