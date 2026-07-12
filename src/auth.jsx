import { createContext, useContext, useEffect, useState } from 'react';
import { safeLocal } from './utils/safeStorage.js';

const TOKEN_KEY = 'coffee_tracker_token';
// Vite injects this at build time; localhost fallback for dev.
const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeLocal.get(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  // Transient signal from the most recent /auth/register: did the initial
  // verification email actually go out? null = unknown (after a reload, or for
  // sign-in/OAuth). Lets the verify banner be honest instead of always
  // claiming "we sent a link".
  const [verificationEmailSent, setVerificationEmailSent] = useState(null);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setUser(d.user))
      .catch((err) => {
        // Only a definitive "this token is no good" (401/403) logs the user
        // out. `err` is the Response itself for HTTP failures (see the
        // Promise.reject(r) above) but a TypeError for network failures, so
        // sniff for a numeric status instead of assuming a shape. On network
        // blips / 5xx we keep the stored token: user stays null for now and
        // the next mount retries with the same token.
        const status = typeof err?.status === 'number' ? err.status : null;
        if (status === 401 || status === 403) {
          setToken(null);
          safeLocal.remove(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  function setAuthToken(t) {
    if (t) safeLocal.set(TOKEN_KEY, t);
    else safeLocal.remove(TOKEN_KEY);
    setToken(t);
  }

  function logout() {
    // Revoke the token server-side so a stolen/leaked bearer token is actually
    // dead, not just forgotten by this browser. Best-effort + optimistic: we
    // fire-and-forget and clear locally immediately so sign-out never hangs on
    // the network. auth:sanctum reads the token from the Authorization header.
    const current = token;
    if (current) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${current}`, Accept: 'application/json' },
        keepalive: true,
      }).catch(() => { /* logging out locally regardless */ });
    }
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, setAuthToken, logout, verificationEmailSent, setVerificationEmailSent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}

export function authFetch(token, path, options = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}/api${path}`, { ...options, headers })
    .then(async (res) => {
      if (!res.ok) {
        const err = new Error(`${res.status} ${res.statusText}`);
        err.status = res.status;
        try { err.body = await res.json(); } catch {}
        throw err;
      }
      if (res.status === 204) return null;
      return res.json();
    });
}

export const GOOGLE_REDIRECT_URL = `${API_BASE}/auth/google/redirect`;
