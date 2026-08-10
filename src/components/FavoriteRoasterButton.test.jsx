import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import FavoriteRoasterButton from './FavoriteRoasterButton.jsx';

const mockAuth = { user: { id: 1, email: 'a@example.com' } };
vi.mock('../auth.jsx', () => ({
  useAuth: () => mockAuth,
}));

const toggle = vi.fn();
let favoriteIds = new Set();
vi.mock('../hooks/useFavoriteRoasters.jsx', () => ({
  useFavoriteRoasters: () => ({ ids: favoriteIds, toggle }),
}));

const roaster = { id: 7, name: 'JJ Bean', slug: 'jj-bean' };

describe('FavoriteRoasterButton', () => {
  afterEach(() => {
    cleanup();
    toggle.mockClear();
    favoriteIds = new Set();
    mockAuth.user = { id: 1, email: 'a@example.com' };
  });

  it('renders an unpressed pin toggle when not favorited', () => {
    render(<FavoriteRoasterButton roaster={roaster} />);
    const btn = screen.getByRole('button', { name: 'Pin JJ Bean' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders pressed with an unpin label when favorited', () => {
    favoriteIds = new Set([7]);
    render(<FavoriteRoasterButton roaster={roaster} />);
    const btn = screen.getByRole('button', { name: 'Unpin JJ Bean' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls toggle with the roaster on click (and stops row navigation)', () => {
    render(<FavoriteRoasterButton roaster={roaster} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pin JJ Bean' }));
    expect(toggle).toHaveBeenCalledWith(roaster);
  });

  it('renders nothing when signed out', () => {
    mockAuth.user = null;
    const { container } = render(<FavoriteRoasterButton roaster={roaster} />);
    expect(container.firstChild).toBeNull();
  });
});
