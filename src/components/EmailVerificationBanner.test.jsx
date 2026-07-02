import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../auth.jsx';
import EmailVerificationBanner from './EmailVerificationBanner.jsx';

const TOKEN_KEY = 'coffee_tracker_token';

/**
 * Stub fetch so AuthProvider's /me bootstrap yields the given user, and the
 * resend endpoint responds per `resend`. Seeds a stored token so the
 * provider actually fetches /me.
 */
function setup({ user, resend } = {}) {
  localStorage.setItem(TOKEN_KEY, 'tok-123');
  const fetchMock = vi.fn((url) => {
    const u = String(url);
    if (u.includes('/api/me')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ user }) });
    }
    if (u.includes('/email/verify/resend')) {
      return Promise.resolve(
        resend ?? { ok: true, status: 200, json: () => Promise.resolve({}) }
      );
    }
    return Promise.reject(new Error(`unexpected fetch: ${u}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  render(
    <AuthProvider>
      <EmailVerificationBanner />
    </AuthProvider>
  );
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('EmailVerificationBanner', () => {
  it('renders nothing for a verified user', async () => {
    const fetchMock = setup({ user: { email: 'v@example.com', email_verified: true } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Give the /me promise chain a beat to settle, then assert no banner.
    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
    expect(screen.queryByText(/Verify your email/)).not.toBeInTheDocument();
  });

  it('renders the banner for an unverified user', async () => {
    setup({ user: { email: 'u@example.com', email_verified: false } });
    expect(await screen.findByText(/Verify your email/)).toBeInTheDocument();
    expect(screen.getByText('u@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend link' })).toBeEnabled();
  });

  it('shows a disabled "Sent ✓" button after a successful resend', async () => {
    setup({
      user: { email: 'u@example.com', email_verified: false },
      resend: { ok: true, status: 200, json: () => Promise.resolve({}) },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Resend link' }));
    const sent = await screen.findByRole('button', { name: 'Sent ✓' });
    expect(sent).toBeDisabled();
    // No error copy on the happy path.
    expect(screen.queryByText(/Couldn't send/)).not.toBeInTheDocument();
  });

  it('surfaces a visible error when the resend fails', async () => {
    setup({
      user: { email: 'u@example.com', email_verified: false },
      resend: { ok: false, status: 500, statusText: 'Server Error', json: () => Promise.resolve({}) },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Resend link' }));
    // The regression: this failure used to be completely silent.
    expect(
      await screen.findByText("Couldn't send — try again in a minute.")
    ).toBeInTheDocument();
    // Error lives in an always-mounted live region.
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't send");
    // Button re-enables so the user can retry.
    expect(screen.getByRole('button', { name: 'Resend link' })).toBeEnabled();
  });
});
