import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoastersPage from './RoastersPage.jsx';

/**
 * Pinned-roaster behavior on the directory: favorites float to the top
 * (stable partition), the "Pinned" chip narrows to favorites, and neither
 * appears when signed out.
 */

const mkRoaster = (o = {}) => ({
  id: 1,
  slug: 'alpha',
  name: 'Alpha',
  city: 'Vancouver',
  region: 'BC',
  country_code: 'CA',
  has_shipping: true,
  is_online_only: false,
  latitude: null,
  longitude: null,
  favicon_url: null,
  in_stock_count: 3,
  coffees_count: 3,
  cpg_min: 8,
  cpg_max: 12,
  shipping_cost: 10,
  free_shipping_over: 50,
  search_terms: '',
  ...o,
});

const roastersFixture = [
  mkRoaster({ id: 1, slug: 'alpha', name: 'Alpha' }),
  mkRoaster({ id: 2, slug: 'bravo', name: 'Bravo' }),
  mkRoaster({ id: 3, slug: 'charlie', name: 'Charlie' }),
];

vi.mock('../api.js', () => ({
  api: {
    listRoasterSummaries: () => Promise.resolve({ roasters: roastersFixture }),
  },
}));

const mockAuth = { user: { id: 1, email: 'a@example.com' } };
vi.mock('../auth.jsx', () => ({
  useAuth: () => mockAuth,
}));

let favoriteIds = new Set();
vi.mock('../hooks/useFavoriteRoasters.jsx', () => ({
  useFavoriteRoasters: () => ({ ids: favoriteIds, toggle: vi.fn() }),
}));

vi.mock('../hooks/useUserLocation.js', () => ({
  useUserLocation: () => ({ location: null }),
  readStoredLocation: () => null,
}));

vi.mock('../components/LocationChip.jsx', () => ({
  default: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/roasters']}>
      <RoastersPage />
    </MemoryRouter>
  );
}

// Roaster names in the desktop table, in row order.
async function tableNames() {
  await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  const table = screen.getByRole('table');
  return within(table).getAllByRole('link').map((a) => a.textContent);
}

describe('RoastersPage pinning', () => {
  afterEach(() => {
    cleanup();
    favoriteIds = new Set();
    mockAuth.user = { id: 1, email: 'a@example.com' };
  });

  it('floats favorited roasters to the top, alphabetical within groups', async () => {
    favoriteIds = new Set([3]); // Charlie
    renderPage();
    expect(await tableNames()).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('keeps plain alphabetical order with no favorites', async () => {
    renderPage();
    expect(await tableNames()).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('the Pinned chip narrows the list to favorites only', async () => {
    favoriteIds = new Set([2]);
    renderPage();
    await tableNames();
    fireEvent.click(screen.getByRole('button', { name: /pinned/i }));
    expect(await tableNames()).toEqual(['Bravo']);
  });

  it('hides the Pinned chip and pin buttons when signed out', async () => {
    mockAuth.user = null;
    renderPage();
    await tableNames();
    expect(screen.queryByRole('button', { name: /pinned/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pin / })).not.toBeInTheDocument();
  });
});
