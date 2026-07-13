// Vite injects import.meta.env.VITE_API_BASE at build time. Falls back
// to localhost so dev still works without a .env file.
const BASE = (import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000') + '/api';

// Map an HTTP status to a friendly, user-facing message. Deliberately
// vague about internals — no URLs, no base host, no status codes leak
// into the UI. Technical detail goes to the console for debugging.
function friendlyHttpMessage(status) {
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 429) return "We're getting a lot of requests right now — please try again in a moment.";
  if (status >= 500) return 'Something went wrong on our end. Please try again shortly.';
  return 'Something went wrong loading this page. Please try again.';
}

// A hung TCP connection (server accepted but never responds) leaves fetch()
// pending forever — the landing page would spin indefinitely with no error.
// Bound every request with an AbortController timeout.
const DEFAULT_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// GET the JSON at `path`. These endpoints are all idempotent, so a single
// retry on a transient failure (timeout, dropped connection, 5xx) is safe and
// smooths over the flaky-network / cold-start blips that otherwise dump the
// user straight to an error screen. 4xx are not retried (they won't change).
async function getJson(path, { retries = 1 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetchWithTimeout(`${BASE}${path}`);
    } catch (networkErr) {
      const timedOut = networkErr?.name === 'AbortError';
      console.error(`[api] ${timedOut ? 'timeout' : 'network error'} for ${path}:`, networkErr);
      if (attempt < retries) continue;
      throw new Error(
        timedOut
          ? 'This is taking longer than expected. Please check your connection and try again.'
          : "We couldn't reach the server. Check your connection and try again."
      );
    }
    if (res.status >= 500 && attempt < retries) {
      console.error(`[api] ${res.status} for ${path}; retrying once`);
      continue;
    }
    if (!res.ok) {
      console.error(`[api] ${res.status} ${res.statusText} for ${BASE}${path}`);
      throw new Error(friendlyHttpMessage(res.status));
    }
    return res.json();
  }
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
