import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth.jsx';
import SignUp from './SignUp.jsx';

function renderSignUp() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/sign-up']}>
        <SignUp />
      </MemoryRouter>
    </AuthProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('SignUp form accessibility', () => {
  it('exposes all five inputs via their labels', () => {
    renderSignUp();
    expect(screen.getByLabelText('Name')).toHaveAttribute('name', 'name');
    expect(screen.getByLabelText('Display name (optional)')).toHaveAttribute('name', 'display_name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('name', 'password');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('name', 'password_confirmation');
  });

  it('renders alerts and focuses the first errored field on a 422', async () => {
    const user = userEvent.setup();
    // authFetch shape: non-ok response -> Error with .body = parsed JSON.
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Content',
        json: () => Promise.resolve({ errors: { name: ['req'], email: ['bad'] } }),
      })
    ));
    renderSignUp();

    await user.type(screen.getByLabelText('Name'), 'Jane');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Field renders each error with role="alert"; both errored fields show up.
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.getByText('req')).toBeInTheDocument();
    expect(screen.getByText('bad')).toBeInTheDocument();

    // Focus lands on the FIRST errored field in form order: Name.
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });
});
