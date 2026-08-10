import { describe, it, expect } from 'vitest';
import { getFaviconSources, roasterTint, roasterInitials } from './roasterFavicon.js';

describe('getFaviconSources', () => {
  it('returns nulls for a missing url', () => {
    expect(getFaviconSources(null)).toEqual({ src: null, srcSet: undefined });
    expect(getFaviconSources('')).toEqual({ src: null, srcSet: undefined });
  });

  it('builds a 1x/2x srcSet for Google S2 urls, rewriting the existing sz', () => {
    const { src, srcSet } = getFaviconSources(
      'https://www.google.com/s2/favicons?domain=example.com&sz=128'
    );
    expect(src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');
    expect(srcSet).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=64 1x, ' +
        'https://www.google.com/s2/favicons?domain=example.com&sz=128 2x'
    );
  });

  it('handles S2 urls without an sz param', () => {
    const { src, srcSet } = getFaviconSources(
      'https://www.google.com/s2/favicons?domain=example.com'
    );
    expect(src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');
    expect(srcSet).toContain('sz=64 1x');
  });

  it('handles a legacy sz=64 url (older cached API payloads)', () => {
    const { src } = getFaviconSources(
      'https://www.google.com/s2/favicons?domain=example.com&sz=64'
    );
    expect(src).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=128');
  });

  it('passes non-S2 urls through untouched', () => {
    const url = 'https://roaster.example.com/apple-touch-icon.png';
    expect(getFaviconSources(url)).toEqual({ src: url, srcSet: undefined });
  });
});

describe('roasterTint', () => {
  it('is deterministic and in range', () => {
    const a = roasterTint('House of Funk');
    expect(a).toEqual(roasterTint('House of Funk'));
    expect(a.hue).toBeGreaterThanOrEqual(0);
    expect(a.hue).toBeLessThan(360);
    expect(a.sat).toBeGreaterThanOrEqual(35);
    expect(a.sat).toBeLessThan(60);
  });

  it('differs between names', () => {
    expect(roasterTint('House of Funk').hue).not.toBe(roasterTint('JJ Bean').hue);
  });
});

describe('roasterInitials', () => {
  it('uses the first letters of the first two words', () => {
    expect(roasterInitials('House of Funk')).toBe('HO');
    expect(roasterInitials('Prototype')).toBe('PR');
    expect(roasterInitials('')).toBe('?');
  });
});
