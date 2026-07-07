import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth.jsx';

const TOKEN_KEY = 'coffee_tracker_token';

/** Tiny consumer that surfaces auth state so tests can observe it. */
function Probe() {
  const { user, loading, token } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'no-user'}</span>
      <span data-testid="loading">{loading ? 'loading' : 'settled'}</span>
      <span data-testid="token">{token ?? 'no-token'}</span>
    </div>
  );
}

/** Seed a stored token, stub fetch with the given /me behavior, render. */
function renderWithStoredToken(fetchImpl) {
  localStorage.setItem(TOKEN_KEY, 'tok-123');
  const fetchMock = vi.fn(fetchImpl);
  vi.stubGlobal('fetch', fetchMock);
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  return fetchMock;
}

/** The /me bootstrap sets loading true synchronously on mount and flips it
 *  back in .finally() — so "settled" means the fetch outcome was processed. */
async function waitForSettled() {
  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('settled'));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('AuthProvider /me bootstrap', () => {
  it('clears the stored token when /me returns 401', async () => {
    renderWithStoredToken(() =>
      Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) })
    );
    await waitForSettled();
    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('keeps the token when /me returns 500', async () => {
    const fetchMock = renderWithStoredToken(() =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );
    await waitForSettled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123');
    expect(screen.getByTestId('token')).toHaveTextContent('tok-123');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('keeps the token when fetch rejects with a network error', async () => {
    const fetchMock = renderWithStoredToken(() =>
      Promise.reject(new TypeError('Failed to fetch'))
    );
    await waitForSettled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123');
    expect(screen.getByTestId('token')).toHaveTextContent('tok-123');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('sets the user when /me succeeds', async () => {
    renderWithStoredToken(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: { email: 'jane@example.com' } }),
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('jane@example.com')
    );
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123');
  });
});
