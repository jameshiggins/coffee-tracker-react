import { describe, it, expect, vi, beforeAll } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BeanCard from './BeanCard.jsx';
import { WishlistProvider } from '../hooks/useWishlist.jsx';

// Signed-out visitor; WishlistProvider consumes the same mocked module.
vi.mock('../auth.jsx', () => ({
  useAuth: () => ({ user: null, token: null }),
  authFetch: vi.fn(() => Promise.resolve({ items: [] })),
}));

// BeanCard lazy-loads tastings on expand.
vi.mock('../api.js', () => ({
  api: { getCoffeeTastings: vi.fn(() => Promise.resolve({ tastings: [] })) },
}));

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView; BeanCard calls it on expand.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const bean = {
  id: 42,
  name: 'Disclosure Test Blend',
  is_blend: true,
  process: null,
  origin: null,
  varietal: null,
  roast_level: null,
  elevation_meters: null,
  tasting_notes: null,
  description: null,
  image_url: null,
  is_removed: false,
  rating: null,
  variants: [],
  roaster: { name: 'Test Roaster', slug: 'test-roaster', favicon_url: null },
};

/** Expansion is parent-controlled, so the harness owns the state. */
function Harness() {
  const [expanded, setExpanded] = useState(false);
  return (
    <MemoryRouter>
      <WishlistProvider>
        <BeanCard
          coffee={bean}
          isExpanded={expanded}
          onExpandToggle={() => setExpanded((v) => !v)}
        />
      </WishlistProvider>
    </MemoryRouter>
  );
}

describe('BeanCard disclosure keyboard access', () => {
  it('expands via Enter on the name button and wires aria-expanded/controls', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const nameBtn = screen.getByRole('button', { name: 'Disclosure Test Blend' });
    expect(nameBtn).toHaveAttribute('aria-expanded', 'false');

    nameBtn.focus();
    await user.keyboard('{Enter}');

    expect(nameBtn).toHaveAttribute('aria-expanded', 'true');
    const regionId = nameBtn.getAttribute('aria-controls');
    expect(regionId).toBeTruthy();
    await waitFor(() => expect(document.getElementById(regionId)).toBeInTheDocument());
    // Expanded body content (signed-out empty state) is visible.
    expect(await screen.findByText(/No tastings yet/)).toBeInTheDocument();
  });

  it('collapses on Escape and returns focus to the name button', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const nameBtn = screen.getByRole('button', { name: 'Disclosure Test Blend' });
    nameBtn.focus();
    await user.keyboard('{Enter}');
    await screen.findByText(/No tastings yet/);

    // Escape should work from anywhere inside the card, not just the button.
    screen.getByRole('link', { name: 'Sign in' }).focus();
    await user.keyboard('{Escape}');

    expect(nameBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/No tastings yet/)).not.toBeInTheDocument();
    expect(nameBtn).toHaveFocus();
  });
});
