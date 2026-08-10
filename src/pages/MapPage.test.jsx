import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import MapPage from './MapPage.jsx';

/**
 * MapPage behavior around the facade, the accessibility affordances, and
 * error recovery. The heavy Leaflet chunk is mocked out — these tests are
 * about the page, not Leaflet.
 */

const mkRoaster = (o = {}) => ({
  id: 1,
  slug: 'alpha',
  name: 'Alpha Roasters',
  city: 'Vancouver',
  region: 'British Columbia',
  has_shipping: true,
  is_online_only: false,
  latitude: 49.2,
  longitude: -123.1,
  coffees: [],
  ...o,
});

let roastersResponse;
const listRoasters = vi.fn();
vi.mock('../api.js', () => ({
  api: { listRoasters: (...a) => listRoasters(...a) },
}));

vi.mock('../hooks/useUserLocation.js', () => ({
  useUserLocation: () => ({ location: null }),
  readStoredLocation: () => null,
}));

vi.mock('../components/LeafletMap.jsx', () => ({
  default: ({ isDark, focusOnMount }) => (
    <div data-testid="leaflet-map" data-dark={String(isDark)} data-focus={String(focusOnMount)} />
  ),
}));

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('MapPage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    roastersResponse = {
      roasters: [
        mkRoaster({ id: 1, slug: 'alpha', name: 'Alpha Roasters' }),
        mkRoaster({ id: 2, slug: 'bravo', name: 'Bravo Beans', city: 'Victoria' }),
        // No coordinates → counted as "not on map", absent from sr-nav pins.
        mkRoaster({ id: 3, slug: 'charlie', name: 'Charlie Coffee', latitude: null, longitude: null }),
      ],
    };
    listRoasters.mockImplementation(() => Promise.resolve(roastersResponse));
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the facade as a real button before any interaction', async () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /explore canadian coffee roasters/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('leaflet-map')).not.toBeInTheDocument();
  });

  it('exposes every pinned roaster in the sr-only parallel nav', async () => {
    renderPage();
    const nav = await screen.findByRole('navigation', { name: /roasters pinned on the map/i });
    await waitFor(() => {
      expect(within(nav).getByRole('link', { name: /alpha roasters/i })).toBeInTheDocument();
    });
    expect(within(nav).getByRole('link', { name: /bravo beans/i })).toBeInTheDocument();
    // Coordinate-less roaster is NOT a pin — it appears via the "+N not on map" link.
    expect(within(nav).queryByRole('link', { name: /charlie coffee —/i })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /1 more roaster not shown/i })).toBeInTheDocument();
  });

  it('announces the visible pin count via the live region', async () => {
    renderPage();
    await waitFor(() => {
      const status = screen.getAllByRole('status').find((el) => /on the map/.test(el.textContent));
      expect(status.textContent).toMatch(/Showing 2 roasters on the map in All Canada/);
      expect(status.textContent).toMatch(/plus 1 not shown/);
    });
  });

  it('activating the facade button mounts the map; keyboard activation requests focus', async () => {
    renderPage();
    const facade = screen.getByRole('button', { name: /explore canadian coffee roasters/i });
    // fireEvent.click produces detail 0 — the keyboard-style activation.
    fireEvent.click(facade);
    const map = await screen.findByTestId('leaflet-map');
    expect(map).toHaveAttribute('data-focus', 'true');
  });

  it('passes the current theme to the map', async () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('roastmap_theme', 'dark');
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /explore canadian coffee roasters/i }));
    const map = await screen.findByTestId('leaflet-map');
    expect(map).toHaveAttribute('data-dark', 'true');
  });

  it('error state: "Try again" refetches in place without reloading the page', async () => {
    listRoasters.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    renderPage();

    const tryAgain = await screen.findByRole('button', { name: /try again/i });
    expect(listRoasters).toHaveBeenCalledTimes(1);

    fireEvent.click(tryAgain);
    await waitFor(() => expect(listRoasters).toHaveBeenCalledTimes(2));
    // Error card gone, page recovered — the facade is back.
    await screen.findByRole('button', { name: /explore canadian coffee roasters/i });
  });
});
