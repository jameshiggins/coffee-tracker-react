import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import RoasterAvatar from './RoasterAvatar.jsx';

const S2 = 'https://www.google.com/s2/favicons?domain=example.com&sz=128';

function img(container) {
  return container.querySelector('img');
}

describe('RoasterAvatar', () => {
  afterEach(() => cleanup());

  it('renders the favicon with a retina srcSet for S2 urls', () => {
    const { container } = render(<RoasterAvatar name="JJ Bean" faviconUrl={S2} />);
    const el = img(container);
    expect(el).toBeTruthy();
    expect(el.getAttribute('src')).toContain('sz=128');
    expect(el.getAttribute('srcset')).toContain('sz=64 1x');
    expect(el.getAttribute('srcset')).toContain('sz=128 2x');
  });

  it('renders scraped urls without a srcSet', () => {
    const url = 'https://roaster.example.com/apple-touch-icon.png';
    const { container } = render(<RoasterAvatar name="JJ Bean" faviconUrl={url} />);
    const el = img(container);
    expect(el.getAttribute('src')).toBe(url);
    expect(el.getAttribute('srcset')).toBeNull();
  });

  it('keeps a light chip in dark mode so dark marks stay legible', () => {
    const { container } = render(<RoasterAvatar name="JJ Bean" faviconUrl={S2} />);
    expect(container.firstChild.className).toContain('dark:bg-white/95');
  });

  it('falls back to initials when there is no favicon', () => {
    const { container } = render(<RoasterAvatar name="House of Funk" faviconUrl={null} />);
    expect(img(container)).toBeNull();
    expect(screen.getByText('HO')).toBeInTheDocument();
  });

  it('falls back to initials when the image errors', () => {
    const { container } = render(<RoasterAvatar name="House of Funk" faviconUrl={S2} />);
    fireEvent.error(img(container));
    expect(img(container)).toBeNull();
    expect(screen.getByText('HO')).toBeInTheDocument();
  });

  it('is decorative (aria-hidden) — the name is always adjacent text', () => {
    const { container } = render(<RoasterAvatar name="JJ Bean" faviconUrl={S2} />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
    expect(img(container).getAttribute('alt')).toBe('');
  });

  it('respects the size prop', () => {
    const { container } = render(<RoasterAvatar name="JJ Bean" faviconUrl={S2} size={24} />);
    expect(container.firstChild.style.width).toBe('24px');
    expect(container.firstChild.style.height).toBe('24px');
  });
});
