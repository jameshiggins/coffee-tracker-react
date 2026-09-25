/**
 * Hermetic API for the browser tests. The bundle is built with
 * VITE_API_BASE=http://api.test; every request to that host is answered here,
 * and every other off-box request (ipapi.co geolocation, Vercel insights,
 * favicons) is aborted so a test can never depend on the network.
 */

export const TOKEN_KEY = 'coffee_tracker_token';

const mk = (id, name, city, region, extra = {}) => ({
  id,
  slug: name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
  name,
  city,
  region,
  country_code: 'CA',
  has_shipping: true,
  is_online_only: false,
  latitude: null,
  longitude: null,
  favicon_url: null,
  in_stock_count: 6,
  coffees_count: 8,
  cpg_min: 4.0,
  cpg_max: 5.9,
  cpg_min_all: 4.0,
  cpg_max_all: 6.4,
  shipping_cost: 12,
  free_shipping_over: 60,
  search_terms: '',
  ...extra,
});

// Real-length names (the overlap needed a long preview string to show up).
export const ROASTERS = [
  mk(1, 'House of Funk Coffee Roasters', 'North Vancouver', 'BC'),
  mk(2, 'Rocanini Coffee Roasters', 'Steveston', 'BC'),
  mk(3, 'Pallet Coffee Roasters', 'Vancouver', 'BC'),
  mk(4, 'Timbertrain Coffee Roasters', 'Vancouver', 'BC', { shipping_cost: 43 }),
  mk(5, 'JJ Bean', 'Vancouver', 'BC'),
  mk(6, '49th Parallel Coffee Roasters', 'Vancouver', 'BC', { shipping_cost: 0 }),
  mk(7, 'Nemesis Coffee', 'Vancouver', 'BC'),
  mk(8, 'Prototype Coffee', 'Vancouver', 'BC'),
  mk(9, 'Matchstick Coffee Roasters', 'Vancouver', 'BC'),
  mk(10, 'Elysian Coffee Roasters', 'Vancouver', 'BC'),
  mk(11, 'Revolver Coffee', 'Vancouver', 'BC'),
  mk(12, 'Agro Roasters', 'Calgary', 'AB'),
  mk(13, 'Spilt Milk Coffee Roasters', 'Revelstoke', 'BC'),
  mk(14, 'Monogram Coffee', 'Calgary', 'AB'),
  mk(15, 'Phil & Sebastian Coffee Roasters', 'Calgary', 'AB'),
  mk(16, 'Pilot Coffee Roasters', 'Toronto', 'ON'),
  mk(17, 'De Mello Coffee Roasters', 'Toronto', 'ON'),
  mk(18, 'Detour Coffee Roasters', 'Hamilton', 'ON'),
  mk(19, 'Subtext Coffee Roasters', 'Toronto', 'ON'),
  mk(20, 'Anchored Coffee', 'Dartmouth', 'NS', { is_online_only: true }),
];

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/**
 * Wire the mocked API into a page.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ signedIn?: boolean, favoriteIds?: number[], roasters?: object[] }} opts
 */
export async function installApi(
  page,
  { signedIn = false, favoriteIds = [], roasters = ROASTERS } = {},
) {
  if (signedIn) {
    await page.addInitScript(
      ([key]) => {
        localStorage.setItem(key, 'e2e-token');
      },
      [TOKEN_KEY],
    );
  }

  // Registered first = matched last: anything not on our two hosts is cut off.
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === '127.0.0.1' || hostname === 'api.test') return route.fallback();
    return route.abort('blockedbyclient');
  });

  await page.route('http://api.test/api/**', (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());
    const method = req.method();

    if (pathname === '/api/roasters/summary') return json(route, { roasters });
    if (pathname === '/api/me') {
      return signedIn
        ? json(route, {
            user: { id: 1, email: 'e2e@example.com', display_name: 'E2E', email_verified: true },
          })
        : json(route, { message: 'Unauthenticated.' }, 401);
    }
    if (pathname === '/api/me/favorite-roasters' && method === 'GET') {
      const items = favoriteIds
        .map((id) => roasters.find((r) => r.id === id))
        .filter(Boolean)
        .map((roaster) => ({ roaster }));
      return json(route, { items });
    }
    if (pathname === '/api/wishlist' && method === 'GET') return json(route, { items: [] });

    // Anything else: empty success, but say so — an unexpected call is usually
    // a fixture gap rather than something the layout test should fail on.
    console.warn(`[mockApi] unhandled ${method} ${pathname}`);
    return json(route, {});
  });
}
