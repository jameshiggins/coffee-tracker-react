const BASE = 'http://localhost:8000/api';

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

export const api = {
  listRoasters: () => getJson('/roasters'),
  getRoaster: (slug) => getJson(`/roasters/${slug}`),
};
