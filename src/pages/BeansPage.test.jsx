import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BeansPage from './BeansPage.jsx';

/**
 * BeansPage deep-link behavior (?bean=<id>, fed by the /c/:id redirect).
 *
 * Regression coverage for: deep-linking to a sold-out or discontinued bean
 * used to render nothing, because the default view filters those out and
 * the "Include sold out & discontinued" toggle stayed off.
 */

const mkVariant = (o = {}) => ({
  id: 1, in_stock: true, bag_weight_grams: 340, price: 20, price_per_gram: null, ...o,
});

const mkBean = (o = {}) => ({
  id: 1,
  name: 'Test Bean',
  slug: 'test-bean',
  origin: 'Ethiopia',
  country: 'Ethiopia',
  process: 'Washed',
  roast_level: 'Light',
  varietal: 'Heirloom',
  tasting_notes: 'chocolate, floral',
  is_blend: false,
  is_removed: false,
  elevation_meters: 1600,
  rating: null,
  image_url: null,
  product_url: null,
  variants: [mkVariant()],
  default_variant: mkVariant(),
  roaster: { id: 1, slug: 'roaster-a', name: 'Roaster A', latitude: 49, longitude: -123, favicon_url: null },
  tokens: [],
  ...o,
});

const beansFixture = [
  mkBean({ id: 1, name: 'In Stock Bean' }),
  mkBean({
    id: 2,
    name: 'Sold Out Bean',
    variants: [mkVariant({ in_stock: false })],
    default_variant: mkVariant({ in_stock: false }),
  }),
];

vi.mock('../hooks/useBeans.js', () => ({
  useBeans: () => ({
    roasters: [{ id: 1, slug: 'roaster-a', name: 'Roaster A', coffees: [] }],
    beans: beansFixture,
    error: null,
    loading: false,
  }),
}));

vi.mock('../hooks/useUserLocation.js', () => ({
  useUserLocation: () => ({ location: null, requestPreciseLocation: vi.fn() }),
  readStoredLocation: () => null,
}));

// Keep the test focused on BeansPage's visibility logic, not card internals.
vi.mock('../components/BeanGrid.jsx', () => ({
  default: ({ beans, expandedId }) => (
    <div data-testid="bean-grid">
      {beans.map((b) => (
        <div key={b.id} data-testid={`bean-${b.id}`} data-expanded={expandedId === b.id}>
          {b.name}
        </div>
      ))}
    </div>
  ),
}));

function renderAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <BeansPage />
    </MemoryRouter>
  );
}

const HISTORICAL_KEY = 'coffee_tracker_show_historical';
const toggle = () => screen.getByLabelText(/include sold out/i);

describe('BeansPage ?bean= deep link', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('auto-enables the historical toggle for a sold-out bean and shows its card', async () => {
    renderAt('/beans?bean=2');
    await waitFor(() => expect(screen.getByTestId('bean-2')).toBeInTheDocument());
    expect(screen.getByTestId('bean-2')).toHaveAttribute('data-expanded', 'true');
    expect(toggle()).toBeChecked();
  });

  it('does not persist the automatic toggle to localStorage', async () => {
    renderAt('/beans?bean=2');
    await waitFor(() => expect(toggle()).toBeChecked());
    expect(localStorage.getItem(HISTORICAL_KEY)).not.toBe('1');
  });

  it('leaves the toggle off for an in-stock deep link', async () => {
    renderAt('/beans?bean=1');
    await waitFor(() => expect(screen.getByTestId('bean-1')).toBeInTheDocument());
    expect(toggle()).not.toBeChecked();
    // sold-out bean stays hidden
    expect(screen.queryByTestId('bean-2')).not.toBeInTheDocument();
  });

  it('auto-enables for a discontinued (soft-removed) bean too', async () => {
    beansFixture.push(mkBean({ id: 3, name: 'Removed Bean', is_removed: true }));
    renderAt('/beans?bean=3');
    await waitFor(() => expect(screen.getByTestId('bean-3')).toBeInTheDocument());
    expect(toggle()).toBeChecked();
    beansFixture.pop();
  });
});
