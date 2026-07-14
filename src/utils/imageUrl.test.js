import { describe, it, expect } from 'vitest';
import { thumbnailUrl } from './imageUrl.js';

describe('thumbnailUrl', () => {
  it('adds a width param to Shopify CDN URLs (preserving existing query)', () => {
    const out = thumbnailUrl('https://cdn.shopify.com/s/files/1/0/p.jpg?v=123', 160);
    expect(out).toContain('width=160');
    expect(out).toContain('v=123');
  });

  it('handles *.myshopify.com and *.shopifycdn.com hosts', () => {
    expect(thumbnailUrl('https://shop.myshopify.com/x.png', 200)).toContain('width=200');
    expect(thumbnailUrl('https://abc.shopifycdn.com/x.png', 200)).toContain('width=200');
  });

  it('adds a format param to Squarespace CDN URLs', () => {
    const out = thumbnailUrl('https://images.squarespace-cdn.com/content/abc/x.jpg', 300);
    expect(out).toContain('format=300w');
  });

  it('leaves unknown CDNs completely untouched', () => {
    const url = 'https://example.com/images/bean.jpg?v=9';
    expect(thumbnailUrl(url, 200)).toBe(url);
  });

  it('returns malformed / relative / empty input unchanged', () => {
    expect(thumbnailUrl('/local/x.jpg', 200)).toBe('/local/x.jpg');
    expect(thumbnailUrl('', 200)).toBe('');
    expect(thumbnailUrl(null, 200)).toBe(null);
    expect(thumbnailUrl(undefined, 200)).toBe(undefined);
  });
});
