import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import MapPopupCard from './MapPopupCard.jsx';

const roaster = {
  slug: 'jj-bean',
  name: 'JJ Bean',
  city: 'Vancouver',
  region: 'BC',
  free_shipping_over: 50,
  website_url: 'https://jjbean.example.com',
};

describe('MapPopupCard', () => {
  afterEach(() => cleanup());

  it('renders name, place, stock count, and CTAs', () => {
    render(
      <MemoryRouter>
        <MapPopupCard roaster={roaster} inStockCount={7} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'JJ Bean' })).toHaveAttribute('href', '/beans?roaster=jj-bean');
    expect(screen.getByText('Vancouver, BC')).toBeInTheDocument();
    expect(screen.getByText(/beans in stock/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view 7 beans/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit site/i })).toHaveAttribute('href', roaster.website_url);
  });

  it('carries NO inline colors — theming must stay CSS-driven so open popups follow theme flips', () => {
    // The popup is renderToStaticMarkup output pinned in the DOM; any color
    // set via a style attribute would be frozen at render time and ignore
    // `.dark`. This is the regression guard for the tokenization.
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MapPopupCard roaster={roaster} inStockCount={7} />
      </MemoryRouter>
    );
    expect(html).not.toMatch(/style="[^"]*(color|background)/i);
    expect(html).not.toMatch(/#6f4326|#7a5a3a|#fef6e7|#3a2614/i);
    // The semantic classes the CSS hooks onto are present.
    expect(html).toContain('rm-popup__title');
    expect(html).toContain('rm-popup-btn--primary');
  });

  it('renders as static markup without errors (the ClusterLayer path)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MapPopupCard roaster={{ slug: 'x', name: 'X' }} inStockCount={0} />
      </MemoryRouter>
    );
    expect(html).toContain('rm-popup');
  });
});
