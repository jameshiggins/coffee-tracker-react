import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AccountSettings from './AccountSettings.jsx';

const authFetch = vi.fn();
const setUser = vi.fn();
const setAuthToken = vi.fn();

const mockAuth = {
  token: 'tok',
  user: null,
  setUser,
  setAuthToken,
  loading: false,
  logout: vi.fn(),
};

vi.mock('../auth.jsx', () => ({
  useAuth: () => mockAuth,
  authFetch: (...args) => authFetch(...args),
}));

const favorites = { items: [], remove: vi.fn() };
vi.mock('../hooks/useFavoriteRoasters.jsx', () => ({
  useFavoriteRoasters: () => favorites,
}));

const baseUser = {
  id: 1,
  name: 'Alice Example',
  email: 'alice@example.com',
  display_name: 'alice',
  avatar_url: null,
  email_verified: true,
  google_linked: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/me/settings']}>
      <Routes>
        <Route path="/me/settings" element={<AccountSettings />} />
        <Route path="/" element={<div>home</div>} />
        <Route path="/sign-in" element={<div>sign in</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AccountSettings', () => {
  beforeEach(() => {
    mockAuth.token = 'tok';
    mockAuth.user = { ...baseUser };
    favorites.items = [];
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('redirects to sign-in when signed out', () => {
    mockAuth.token = null;
    mockAuth.user = null;
    renderPage();
    expect(screen.getByText('sign in')).toBeInTheDocument();
  });

  it('renders every section', () => {
    renderPage();
    for (const title of ['Profile', 'Pinned roasters', 'Email', 'Password', 'Your stuff', 'Danger zone']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('saves the profile and updates auth state', async () => {
    authFetch.mockResolvedValueOnce({ user: { ...baseUser, display_name: 'alice-b' } });
    renderPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice-b' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ display_name: 'alice-b' })));
    expect(authFetch).toHaveBeenCalledWith('tok', '/me', expect.objectContaining({ method: 'PATCH' }));
  });

  it('shows a field-level 422 error inline', async () => {
    const err = new Error('422');
    err.status = 422;
    err.body = { errors: { display_name: ['That username is taken.'] } };
    authFetch.mockRejectedValueOnce(err);
    renderPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'taken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(await screen.findByText('That username is taken.')).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });

  it('shows the forgot-password hint only for Google-linked accounts', () => {
    renderPage();
    expect(screen.queryByText(/never set a password/i)).not.toBeInTheDocument();
    cleanup();

    mockAuth.user = { ...baseUser, google_linked: true };
    renderPage();
    expect(screen.getAllByText(/never set a password/i).length).toBeGreaterThan(0);
  });

  it('lists pinned roasters with an unpin action', () => {
    favorites.items = [
      { id: 11, roaster: { id: 5, name: 'JJ Bean', slug: 'jj-bean', favicon_url: null, city: 'Vancouver', region: 'BC' } },
    ];
    renderPage();

    const section = screen.getByRole('heading', { name: 'Pinned roasters' }).closest('div');
    expect(within(section).getByText('JJ Bean')).toBeInTheDocument();
    fireEvent.click(within(section).getByRole('button', { name: 'Unpin' }));
    expect(favorites.remove).toHaveBeenCalledWith(expect.objectContaining({ slug: 'jj-bean' }));
  });

  it('delete flow: button disabled until a password is typed, then deletes and signs out', async () => {
    authFetch.mockResolvedValueOnce(null); // DELETE /me → 204
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    const dialog = await screen.findByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Delete forever' });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'hunter22' } });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);
    await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith(null));
    expect(authFetch).toHaveBeenCalledWith('tok', '/me', expect.objectContaining({ method: 'DELETE' }));
    expect(await screen.findByText('home')).toBeInTheDocument();
  });
});
