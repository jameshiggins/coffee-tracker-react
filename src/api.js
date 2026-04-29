const BASE = 'http://localhost:8000/api';

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

  forgotPassword: (email) => fetch(`http://localhost:8000/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(async (r) => r.ok ? r.json() : Promise.reject(await r.text())),

  resetPassword: (data) => fetch(`http://localhost:8000/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (r) => {
    const body = await r.json();
    if (!r.ok) throw body;
    return body;
  }),
};
