// Vite injects import.meta.env.VITE_API_BASE at build time. Falls back
// to localhost so dev still works without a .env file.
const BASE = (import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000') + '/api';

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

export const api = {
  listRoasters: () => getJson('/roasters'),
  getRoaster: (slug) => getJson(`/roasters/${slug}`),
  getCoffee: (id) => getJson(`/coffees/${id}`),
  getCoffeeTastings: (id) => getJson(`/coffees/${id}/tastings`),
  getPublicTasting: (id) => getJson(`/tastings/${id}/public`),
  getUserProfile: (displayName) => getJson(`/users/${encodeURIComponent(displayName)}`),

  // Q17: anyone can flag a public tasting for moderator review.
  reportTasting: (id) => fetch(`${BASE}/tastings/${id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).then((r) => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))),

  forgotPassword: (email) => fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(async (r) => r.ok ? r.json() : Promise.reject(await r.text())),

  resetPassword: (data) => fetch(`${BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (r) => {
    const body = await r.json();
    if (!r.ok) throw body;
    return body;
  }),
};
