import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoastersPage from './RoastersPage.jsx';
import { PINNED_SECTION_OPEN_KEY } from '../hooks/usePinnedSectionOpen.js';

/**
 * Pinned-roaster behaviour on the directory. Favourites render as their own
 * group above the list (never duplicated below it): always open up to three,
 * collapsed by default past that with a remembered toggle. The "Pinned" chip
 * still narrows the whole list to favourites, and nothing pin-related shows
 * when signed out.
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
  mkRoaster({ id: 4, slug: 'delta', name: 'Delta' }),
  mkRoaster({ id: 5, slug: 'echo', name: 'Echo', region: 'AB', city: 'Calgary' }),
  mkRoaster({ id: 6, slug: 'foxtrot', name: 'Foxtrot' }),
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

function renderPage(path = '/roasters') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RoastersPage />
    </MemoryRouter>,
  );
}

// All roaster names in the desktop table, in row order (pinned group first).
async function tableNames() {
  await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  return within(screen.getByRole('table'))
    .getAllByRole('link')
    .map((a) => a.textContent);
}

const desktopPinned = () => screen.queryByTestId('pinned-roasters-desktop');
const pinnedNames = () =>
  desktopPinned()
    ? within(desktopPinned())
        .queryAllByRole('link')
        .map((a) => a.textContent)
    : [];
const mainNames = () =>
  within(screen.getByTestId('roasters-desktop'))
    .getAllByRole('link')
    .map((a) => a.textContent);
const pinnedToggle = () =>
  within(desktopPinned()).queryByRole('button', { name: /pinned roasters/i });

describe('RoastersPage pinning', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    favoriteIds = new Set();
    mockAuth.user = { id: 1, email: 'a@example.com' };
  });

  it('renders no pinned group and plain alphabetical order with no favourites', async () => {
    renderPage();
    expect(await tableNames()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']);
    expect(desktopPinned()).not.toBeInTheDocument();
    expect(screen.queryByText(/all roasters/i)).not.toBeInTheDocument();
  });

  it('groups a single favourite above the list, always open, without duplicating it', async () => {
    favoriteIds = new Set([3]); // Charlie
    renderPage();
    expect(await tableNames()).toEqual(['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrot']);

    expect(screen.getAllByRole('heading', { name: 'Pinned roasters (1)' }).length).toBeGreaterThan(
      0,
    );
    expect(pinnedToggle()).toBeNull(); // ≤3 pins: no toggle
    expect(pinnedNames()).toEqual(['Charlie']);
    expect(mainNames()).not.toContain('Charlie');
    expect(screen.getAllByText('All roasters').length).toBeGreaterThan(0);
  });

  it('stays open with exactly three favourites', async () => {
    favoriteIds = new Set([1, 2, 3]);
    renderPage();
    await tableNames();
    expect(pinnedToggle()).toBeNull();
    expect(pinnedNames()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(mainNames()).toEqual(['Delta', 'Echo', 'Foxtrot']);
  });

  it('collapses by default past three favourites, previews names, and remembers the toggle', async () => {
    favoriteIds = new Set([1, 2, 3, 4]);
    renderPage();
    await tableNames();

    const toggle = pinnedToggle();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('Pinned roasters (4)');
    expect(toggle).toHaveTextContent('Alpha, Bravo, Charlie +1');
    expect(pinnedNames()).toEqual([]); // rows not rendered while collapsed
    expect(mainNames()).toEqual(['Echo', 'Foxtrot']);

    fireEvent.click(toggle);
    expect(pinnedToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(pinnedNames()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
    expect(pinnedToggle()).not.toHaveTextContent('+1'); // preview only while collapsed
    expect(localStorage.getItem(PINNED_SECTION_OPEN_KEY)).toBe('1');

    fireEvent.click(pinnedToggle());
    expect(pinnedToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem(PINNED_SECTION_OPEN_KEY)).toBe('0');
  });

  it('opens on load when the visitor previously expanded it', async () => {
    localStorage.setItem(PINNED_SECTION_OPEN_KEY, '1');
    favoriteIds = new Set([1, 2, 3, 4]);
    renderPage();
    await tableNames();
    expect(pinnedToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(pinnedNames()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('honours the active filters inside the pinned group', async () => {
    favoriteIds = new Set([3, 5]); // Charlie (BC), Echo (AB)
    renderPage('/roasters?region=AB');
    expect(await tableNames()).toEqual(['Echo']);
    expect(screen.getAllByRole('heading', { name: 'Pinned roasters (1)' }).length).toBeGreaterThan(
      0,
    );
    expect(pinnedNames()).toEqual(['Echo']);
    // Nothing unpinned matches the filter, so no "All roasters" divider.
    expect(screen.queryByText('All roasters')).not.toBeInTheDocument();
  });

  it('mirrors the group on the mobile list', async () => {
    favoriteIds = new Set([1, 2, 3, 4]);
    renderPage();
    await tableNames();
    const mobile = screen.getByTestId('pinned-roasters-mobile');
    const toggle = within(mobile).getByRole('button', { name: /pinned roasters \(4\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(
      within(mobile)
        .getAllByRole('link')
        .map((a) => a.textContent.trim()),
    ).toHaveLength(4);
    // One shared state: the desktop group opened too.
    expect(pinnedToggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('the Pinned chip narrows the whole list to favourites and drops the group', async () => {
    favoriteIds = new Set([2]);
    renderPage();
    await tableNames();
    fireEvent.click(screen.getByRole('button', { name: /^pinned$/i }));
    expect(await tableNames()).toEqual(['Bravo']);
    expect(desktopPinned()).not.toBeInTheDocument();
  });

  it('hides the Pinned chip, pin buttons and group when signed out', async () => {
    mockAuth.user = null;
    favoriteIds = new Set([1, 2, 3, 4]); // stale ids must not leak a group
    renderPage();
    await tableNames();
    expect(screen.queryByRole('button', { name: /^pinned$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pin / })).not.toBeInTheDocument();
    expect(desktopPinned()).not.toBeInTheDocument();
  });
});
